const {
  Product,
  ProductVariation,
  Category,
  Collection,
  CollectionProduct,
  Attribute,
  AttributeValue,
  Discount,
  ProductDiscount,
  ProductParams,
  Image,            // +++
  ProductImage
} = require('../models');
const {Op} = require('sequelize');
const Sequelize = require('sequelize');

// Типы источников товаров
const PRODUCTS_SOURCE_TYPES = {
  CATEGORY: 'CATEGORY',
  SELECTION: 'SELECTION',
  COLLECTION: 'COLLECTION'
};

// Направления сортировки
const SORT_DIRECTIONS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Максимальный лимит для запроса
const MAX_LIMIT = 1000;

function getPrice(discount, price) {
  if (discount) {
    return {
      current: Math.ceil(price - (discount.type === 'percent' ? (discount.value / 100) * price : discount.value)),
      old: parseInt(price),
    }
  } else {
    return {
      current: parseInt(price),
      old: null
    }
  }
}

function buildImagesMap(pivots) {
  const map = {};
  for (const p of pivots) {
    if (!p || !p.image) continue;
    if (!map[p.product_id]) map[p.product_id] = [];
    map[p.product_id].push({
      id: p.image.id,
      url: p.image.file_url,
      path: p.image.file_path,
      sort_order: p.sort_order ?? 0
    });
  }
  // упорядочим
  Object.values(map).forEach(arr => arr.sort((a,b) => (a.sort_order - b.sort_order) || (a.id - b.id)));
  return map;
}

/**
 * Получение списка товаров с фильтрацией, сортировкой и пагинацией
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 */

exports.getProducts = async (req, res) => {
  try {
    const {
      source = null,
      sourceType = PRODUCTS_SOURCE_TYPES.CATEGORY,
      filters = [],
      sort = 'createdAt',
      direction = SORT_DIRECTIONS.DESC,
      limit = 20,
      offset = 0
    } = req.body;

    const validatedLimit = Math.min(parseInt(limit), MAX_LIMIT);
    const validatedOffset = parseInt(offset);

    const where = {};
    const include = [];

    // Источник (категория/коллекция)
    if (source && sourceType) {
      switch (sourceType) {
        case PRODUCTS_SOURCE_TYPES.CATEGORY:
          include.push({
            model: Category,
            as: 'category',
            where: {[Op.or]: [{id: source}, {slug: source}]},
            attributes: [],
            required: true
          });
          break;
        case PRODUCTS_SOURCE_TYPES.COLLECTION:
          include.push({
            model: CollectionProduct,
            attributes: [],
            required: true,
            include: [{
              model: Collection,
              where: {[Op.or]: [{id: source}, {slug: source}]},
              attributes: [],
              required: true
            }]
          });
          break;
      }
    }

    // Фильтры
    const attributeFilters = [];
    let inStockFilter = false;

    for (const filter of (filters || [])) {
      switch (filter.type) {
        case 'PRICE': {
          const min = Number(filter.data?.min ?? 0);
          const max = Number(filter.data?.max ?? 1000000);
          where.price = { [Op.between]: [min, max] };
          break;
        }
        case 'ATTRIBUTE': {
          if (Array.isArray(filter.data?.values) && filter.data.values.length) {
            attributeFilters.push(...filter.data.values);
          }
          break;
        }
        case 'STOCK': {
          inStockFilter = true;
          break;
        }
      }
    }

    // Вариации — добавляем include только когда это нужно
    if (inStockFilter || attributeFilters.length > 0) {
      const varInclude = {
        model: ProductVariation,
        as: 'variations',
        attributes: [],
        required: !!inStockFilter || attributeFilters.length > 0
      };

      if (inStockFilter) {
        varInclude.where = { stock_quantity: { [Op.gt]: 0 } };
      }

      if (attributeFilters.length > 0) {
        varInclude.include = [{
          model: AttributeValue,
          as: 'attributes',
          attributes: [],
          where: { id: { [Op.in]: attributeFilters } },
          include: [{ model: Attribute, as: 'attribute', attributes: [] }]
        }];
      }

      include.push(varInclude);
    }

    // Сортировка
    const order = [];
    const validSortFields = ['title', 'createdAt', 'updatedAt'];
    if (validSortFields.includes(sort)) {
      order.push([sort, direction]);
    } else {
      order.push(['created_at', 'DESC']);
    }

    // Основной запрос
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        ...include,
        {
          where: { is_active: true },
          model: Discount,
          as: 'discounts',
          through: { attributes: [] },
          required: false
        }
      ],
      attributes: ['id', 'title', 'sku', 'slug', 'price', 'category_id'],
      order,
      limit: validatedLimit,
      offset: validatedOffset,
      distinct: true,
      subQuery: false
    });

    const productIds = products.map(p => p.id);
    console.log('productIds', productIds);
    // Атрибуты для витрины (цвет/размер)
    const attributesData = productIds.length ? await ProductVariation.findAll({
      where: { product_id: { [Op.in]: productIds } },
      include: [{
        model: AttributeValue,
        as: 'attributes',
        include: [{
          model: Attribute,
          as: 'attribute',
          where: { name: { [Op.in]: ['Цвет', 'Размер'] } }
        }]
      }],
      attributes: ['product_id']
    }) : [];

    // Картинки одним запросом
    const pivots = productIds.length ? await ProductImage.findAll({
      where: { product_id: { [Op.in]: productIds } },
      attributes: {                       // <- ключевой момент
        include: ['product_id', 'image_id', 'sort_order'],
      },
      include: [{ model: Image, attributes: ['id','file_url','file_path'], as: 'image' }],
      order: [['sort_order','ASC'], ['image_id','ASC']],
    }) : [];


    const imagesMap = buildImagesMap(pivots);
    console.log('imagesMap', imagesMap);

    // Группировка атрибутов
    const attributesMap = {};
    attributesData.forEach(variation => {
      const productId = variation.product_id;
      if (!attributesMap[productId]) {
        attributesMap[productId] = { colors: new Map(), sizes: new Map() };
      }
      (variation.attributes || []).forEach(attr => {
        const attrName = attr.attribute?.name;
        if (attrName === 'Цвет') {
          if (!attributesMap[productId].colors.has(attr.id)) {
            attributesMap[productId].colors.set(attr.id, {
              id: attr.id,
              value: attr.value,
              hex_code: attr.hex_code,
              slug: String(attr.value).toLowerCase().replace(/\s+/g,'-')
            });
          }
        } else if (attrName === 'Размер') {
          if (!attributesMap[productId].sizes.has(attr.id)) {
            attributesMap[productId].sizes.set(attr.id, {
              id: attr.id,
              value: attr.value,
              slug: String(attr.value).toLowerCase().replace(/\s+/g,'-')
            });
          }
        }
      });
    });

    // Ответ
    const result = products.map(product => {
      const productId = product.id;
      const discount = product.discounts?.[0];
      const colors = Array.from(attributesMap[productId]?.colors.values() || []);
      const sizes  = Array.from(attributesMap[productId]?.sizes.values()  || []);

      const options = [];
      if (colors.length) options.push({ title: 'Цвет',  type: 'COLOR', values: colors });
      if (sizes.length)  options.push({ title: 'Размер', type: 'SIZE',  values: sizes });

      const getUrls = (images) => {
        if (!images.length) return [];
        console.log(images)
        return images.map(p => p.url)
      }

      return {
        id: productId,
        title: product.title,
        sku: product.sku,
        slug: product.slug,
        images: getUrls(imagesMap[productId] || []),            // <--- ФОТО
        price: getPrice(discount, product.price),
        options
      };
    });

    res.json({ data: result, offset: validatedOffset, limit: validatedLimit, total: count });
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка сервера при получении товаров' });
  }
};


/**
 * Получение расширенной информации о товаре
 */
exports.getProductExtended = async (req, res) => {
  try {
    const {idOrSlug} = req.params;
    const where = isNaN(idOrSlug) ? {slug: idOrSlug} : {id: parseInt(idOrSlug)};

    const product = await Product.findOne({
      where,
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: ProductParams,
          as: 'params'
        },
        {
          where: {is_active: true},
          model: Discount,
          as: 'discounts',
          through: {attributes: []},
          required: false
        },
        {
          model: ProductVariation,
          as: 'variations',
          include: [
            {
              model: AttributeValue, // Исправлено с VariationAttribute
              as: 'attributes',     // Исправлен псевдоним
              include: [
                {
                  model: Attribute,
                  as: 'attribute' // Исправлен псевдоним
                }
              ]
            }
          ]
        },
      ]
    });


    if (!product) {
      return res.status(404).json({code: 'NOT_FOUND', message: 'Товар не найден'});
    }

    // Сбор уникальных значений атрибутов
    const colorOptions = [];
    const sizeOptions = [];

    const discount = product.discounts[0] ?? undefined

    const pivots = await ProductImage.findAll({
      where: { product_id: product.id },
      attributes: { include: ['product_id','image_id','sort_order'], exclude: ['id'] },
      include: [{ model: Image, as: 'image', attributes: ['id','file_url','file_path'] }],
      order: [['sort_order','ASC'], ['image_id','ASC']]
    });

    const images = pivots.filter(p => p.image).map(p => p.image.file_url);


    product.variations.forEach(variation => {
      variation.attributes.forEach(attrValue => { // Исправлено обращение
        const attrName = attrValue.attribute.name; // Исправлен путь

        if (attrName === 'Цвет') {
          if (!colorOptions.find(c => c.id === attrValue.id)) {
            colorOptions.push({
              id: attrValue.id,
              slug: attrValue.value.toLowerCase().replace(/\s+/g, '-'),
              value: attrValue.value,
              hex_code: attrValue.hex_code
            });
          }
        }

        if (attrName === 'Размер') {
          if (!sizeOptions.find(s => s.id === attrValue.id)) {
            sizeOptions.push({
              id: attrValue.id,
              slug: attrValue.value.toLowerCase().replace(/\s+/g, '-'),
              value: attrValue.value
            });
          }
        }
      });
    });

    const params = product.params.map(item => {
      return {
        id: item.id,
        title: item.title,
        value: item.value
      }
    });

    // Форматирование ответа
    const response = {
      id: product.id,
      title: product.title,
      sku: product.sku,
      slug: product.slug,
      images: images,
      price: getPrice(discount, product.price),
      options: [
        {
          title: 'Цвет',
          type: 'COLOR',
          values: colorOptions
        },
        {
          title: 'Размер',
          type: 'SIZE',
          values: sizeOptions
        }
      ],
      params,
      description: product.description,
      meta: {
        title: product.title,
        description: product.meta_description || `${product.title} - купить в нашем магазине`,
        keywords: product.title.split(' ').join(', ')
      },
      category: product.category ? {
        id: product.category.id,
        title: product.category.title,
        slug: product.category.slug
      } : null,
      equipment: [
        {
          id: 1,
          slug: 'original-box',
          title: 'Оригинальная коробка',
          image: '/images/box.jpg',
          description: 'Фирменная упаковка производителя'
        }
      ]
    };

    res.json({product: response});

  } catch (error) {
    console.error('Ошибка при получении товара:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера при получении товара'
    });
  }
};

/**
 * Получение информации о категории товаров
 */
exports.getProductCategory = async (req, res) => {
  try {
    const {idOrSlug} = req.params;

    const category = await Category.findOne({
      where: isNaN(idOrSlug)
        ? {slug: idOrSlug}
        : {id: parseInt(idOrSlug)},
      include: [{
        model: Product,
        attributes: ['id']
      }]
    });

    if (!category) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Категория не найдена'
      });
    }

    // Хлебные крошки (пример)
    const breadcrumbs = [
      {id: 1, slug: 'home', title: 'Главная'},
      {id: 2, slug: 'catalog', title: 'Каталог'},
      {id: category.id, slug: category.slug, title: category.title}
    ];

    res.json({
      category: {
        id: category.id,
        title: category.title,
        slug: category.slug,
        breadcrumbs,
        count: category.Products.length
      }
    });

  } catch (error) {
    console.error('Ошибка при получении категории:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера при получении категории'
    });
  }
};

/**
 * Получение похожих товаров
 */
exports.getSimilarProducts = async (req, res) => {
  try {
    const {idOrSlug} = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 3, 6);
    const offset = parseInt(req.query.offset) || 0;

    // Находим текущий товар
    const currentProduct = await Product.findOne({
      where: isNaN(idOrSlug)
        ? {slug: idOrSlug}
        : {id: parseInt(idOrSlug)}
    });

    if (!currentProduct) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Товар не найден'
      });
    }

    // Ищем похожие товары в той же категории
    const similarProducts = await Product.findAll({
      where: {
        id: {[Op.ne]: currentProduct.id},
        category_id: currentProduct.category_id
      },
      limit,
      offset,
      include: [
        {
          model: ProductVariation,
          as: 'variations',
          include: [
            {
              model: AttributeValue, // Исправлено с VariationAttribute
              as: 'attributes',     // Исправлен псевдоним
              include: [
                {
                  model: Attribute,
                  as: 'attribute' // Исправлен псевдоним
                }
              ]
            }
          ]
        },
        {
          where: {is_active: true},
          model: Discount,
          as: 'discounts',
          through: {attributes: []},
          required: false
        },
      ]
    });

    // Форматирование ответа
    const products = similarProducts.map(product => {
      const colorOptions = [];
      const sizeOptions = [];
      const discount = product?.discounts[0] ?? undefined
      product.variations.forEach(variation => {
        variation.attributes.forEach(attrValue => { // Исправлено обращение
          const attrName = attrValue.attribute.name; // Исправлен путь

          if (attrName === 'Цвет') {
            if (!colorOptions.find(c => c.id === attrValue.id)) {
              colorOptions.push({
                id: attrValue.id,
                slug: attrValue.value.toLowerCase().replace(/\s+/g, '-'),
                value: attrValue.value,
                hex_code: attrValue.hex_code
              });
            }
          }

          if (attrName === 'Размер') {
            if (!sizeOptions.find(s => s.id === attrValue.id)) {
              sizeOptions.push({
                id: attrValue.id,
                slug: attrValue.value.toLowerCase().replace(/\s+/g, '-'),
                value: attrValue.value
              });
            }
          }
        });
      });

      return {
      id: product.id,
      title: product.title,
      sku: product.sku,
      slug: product.slug,
      images: product.main_image ? [product.main_image] : [],
      price: getPrice(discount, product.price),
      options: [
        {
          title: 'Цвет',
          type: 'COLOR',
          values: colorOptions
        },
        {
          title: 'Размер',
          type: 'SIZE',
          values: sizeOptions
        }
      ],
      params: []
    }});

    res.json({
      data: products,
      offset,
      limit,
      total: similarProducts.length
    });

  } catch (error) {
    console.error('Ошибка при получении похожих товаров:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Ошибка сервера при получении похожих товаров'
    });
  }
};


exports.getCatalog = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: {parent_id: null}, // Только корневые категории
      attributes: [
        'id',
        'title',
        'slug',
        [
          Sequelize.literal(`
              (SELECT COUNT(*)
               FROM products
               WHERE products.category_id IN (
                 SELECT id FROM categories WHERE parent_id = "Category".id
                 UNION
                 SELECT "Category".id
               )
              )
            `),
          'count'
        ]
      ],
      include: [{
        model: Category,
        as: 'children',
        attributes: ['id', 'title', 'slug'] // Дочерние без count
      }],
      order: [['title', 'ASC']]
    });

    return res.json(
      {catalog: categories}
    );
  } catch (error) {
    console.error('Catalog error:', error);
    return res.status(500).json({
      code: 'NOT_FOUND',
      message: 'Ошибка при получении каталога'
    });
  }
}
