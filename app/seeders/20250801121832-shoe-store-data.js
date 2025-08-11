'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const categories = await queryInterface.bulkInsert('categories', [
      { title: 'Кроссовки', slug: 'sneakers' },
      { title: 'Ботинки', slug: 'boots' },
      { title: 'Сандалии', slug: 'sandals' },
      { title: 'Туфли', slug: 'shoes-t' }
    ], { returning: true });

    const attributes = await queryInterface.bulkInsert('attributes', [
      { name: 'Размер' },
      { name: 'Цвет' }
    ], { returning: true });

    const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
    const colors = [
      { value: 'Черный', hex_code: '#000000' },
      { value: 'Белый', hex_code: '#FFFFFF' },
      { value: 'Красный', hex_code: '#FF0000' },
      { value: 'Синий', hex_code: '#0000FF' },
      { value: 'Коричневый', hex_code: '#A52A2A' }
    ];

    const sizeValues = await queryInterface.bulkInsert('attribute_values',
        sizes.map(size => ({
          attribute_id: attributes[0].id,
          value: size.toString()
        })), { returning: true }
    );

    const colorValues = await queryInterface.bulkInsert('attribute_values',
        colors.map(color => ({
          attribute_id: attributes[1].id,
          value: color.value,
          hex_code: color.hex_code
        })), { returning: true }
    );

    const products = [];
    const brands = ['Nike', 'Adidas', 'Reebok', 'Puma', 'Geox', 'Ecco', 'Salomon', 'Timberland'];
    const types = {
      sneakers: ['Air Max', 'Ultraboost', 'Classic', 'Runner', 'Trail'],
      boots: ['Chelsea', 'Hiking', 'Combat', 'Snow', 'Work'],
      sandals: ['Flip-flops', 'Slide', 'Sport', 'Orthopedic', 'Beach'],
      shoes: ['Oxford', 'Loafers', 'Derby', 'Monk', 'Brogues']
    };

    for (const category of categories) {
      for (let i = 1; i <= 20; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const type = types[category.slug][Math.floor(Math.random() * types[category.slug].length)];

        products.push({
          title: `${brand} ${type} ${i}`,
          category_id: category.id,
          description: `Стильная и удобная обувь ${category.title.toLowerCase()} от ${brand}. Идеальный выбор для повседневной носки.`,
          slug: `${category.slug}-${brand.toLowerCase()}-${type.toLowerCase()}-${uuidv4().slice(0, 8)}`,
          sku: `${brand.slice(0, 3).toUpperCase()}${category.id}${i}`,
          price: 8000 + Math.floor(Math.random() * 7000), // Цена от 8000 до 15000
        });
      }
    }

    const createdProducts = await queryInterface.bulkInsert('products', products, { returning: true });

    const variations = [];
    for (const product of createdProducts) {
      const selectedSizes = [...sizes].sort(() => 0.5 - Math.random()).slice(0, 3);
      const selectedColors = [...colorValues].sort(() => 0.5 - Math.random()).slice(0, 2);

      for (const size of selectedSizes) {
        for (const color of selectedColors) {
          variations.push({
            product_id: product.id,
            sku: `${product.sku}-${size}-${color.value.slice(0, 3)}`,
            stock_quantity: Math.floor(Math.random() * 50) + 10 // Количество от 10 до 60
          });
        }
      }
    }

    const createdVariations = await queryInterface.bulkInsert('product_variations', variations, { returning: true });

    const variationAttributes = [];
    let varIndex = 0;

    for (const product of createdProducts) {
      const selectedSizes = [...sizes].sort(() => 0.5 - Math.random()).slice(0, 3);
      const selectedColors = [...colorValues].sort(() => 0.5 - Math.random()).slice(0, 2);

      for (const size of selectedSizes) {
        for (const color of selectedColors) {
          const sizeAttr = sizeValues.find(sv => sv.value === size.toString());
          variationAttributes.push(
              {
                variation_id: createdVariations[varIndex].id,
                value_id: sizeAttr.id
              },
              {
                variation_id: createdVariations[varIndex].id,
                value_id: color.id
              }
          );
          varIndex++;
        }
      }
    }

    await queryInterface.bulkInsert('variation_attributes', variationAttributes);

    const discounts = await queryInterface.bulkInsert('discounts', [
      {
        name: 'Летняя распродажа',
        type: 'percent',
        value: 15,
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-08-31'),
        max_users: 1000,
        min_order_amount: 0,
        is_active: true
      },
      {
        name: 'Новинки со скидкой',
        type: 'fixed',
        value: 500,
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-09-30'),
        max_users: 500,
        min_order_amount: 3000,
        is_active: true
      }
    ], { returning: true });

    await queryInterface.bulkInsert('product_discounts', [
      {
        product_id: 1,
        discount_id: 1,
      },
      {
        product_id: 2,
        discount_id: 1,
      },
      {
        product_id: 3,
        discount_id: 1,
      },
      {
        product_id: 4,
        discount_id: 1,
      },
    ], { returning: true });

    // 8. Создаем коллекции
    const collections = await queryInterface.bulkInsert('collections', [
      {
        title: 'Лето 2024',
        description: 'Свежие летние модели для вашего комфорта',
        is_active: true
      },
      {
        title: 'Топ продаж',
        description: 'Самые популярные модели нашего магазина',
        is_active: true
      }
    ], { returning: true });

    // 9. Добавляем продукты в коллекции
    const collectionProducts = [];

    // Для коллекции "Лето 2024" - сандалии и кроссовки
    const summerProducts = createdProducts.filter(p =>
        p.category_id === categories.find(c => c.slug === 'sandals').id ||
        p.category_id === categories.find(c => c.slug === 'sneakers').id
    ).slice(0, 15);

    // Для коллекции "Топ продаж" - случайные продукты
    const topProducts = [...createdProducts].sort(() => 0.5 - Math.random()).slice(0, 20);

    for (const product of summerProducts) {
      collectionProducts.push({
        collection_id: collections[0].id,
        product_id: product.id
      });
    }

    for (const product of topProducts) {
      collectionProducts.push({
        collection_id: collections[1].id,
        product_id: product.id
      });
    }

    await queryInterface.bulkInsert('collection_products', collectionProducts);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('collection_products', null, {});
    await queryInterface.bulkDelete('collections', null, {});
    await queryInterface.bulkDelete('product_discounts', null, {});
    await queryInterface.bulkDelete('variation_attributes', null, {});
    await queryInterface.bulkDelete('product_variations', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('attribute_values', null, {});
    await queryInterface.bulkDelete('attributes', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('discounts', null, {});
  }
};
