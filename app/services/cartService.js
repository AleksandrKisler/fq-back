const {Op} = require('sequelize');

const getModels = () => require('../models');

class CartError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CartError';
    this.statusCode = statusCode;
  }
}

const mapCartItem = cartItem => {
  const plain = typeof cartItem.get === 'function' ? cartItem.get({plain: true}) : cartItem;
  const quantity = Number(plain.quantity) || 0;
  const price = Number(plain.price_at_add) || 0;
  const discount = Number(plain.discount_at_add) || 0;

  return {
    id: plain.id,
    user_id: plain.user_id,
    product_id: plain.product_id,
    variation_id: plain.variation_id,
    quantity,
    price_at_add: price,
    discount_at_add: discount,
    attributes: plain.attributes || {},
    product: plain.product || null,
    variation: plain.variation || null,
    totals: {
      subtotal: parseFloat((price * quantity).toFixed(2)),
      discount: parseFloat((discount * quantity).toFixed(2)),
      total: parseFloat(((price - discount) * quantity).toFixed(2))
    }
  };
};

const calculateTotals = items => {
  return items.reduce(
    (acc, item) => {
      acc.subtotal += item.totals.subtotal;
      acc.discount += item.totals.discount;
      acc.total += item.totals.total;
      return acc;
    },
    {subtotal: 0, discount: 0, total: 0}
  );
};

const getCartItems = async userId => {
  const {Cart, Product, ProductVariation} = getModels();
  const cartItems = await Cart.findAll({
    where: {user_id: userId},
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'title', 'slug', 'price']
      },
      {
        model: ProductVariation,
        as: 'variation',
        attributes: ['id', 'sku', 'stock_quantity'],
        required: false
      }
    ],
    order: [['added_at', 'DESC']]
  });

  const items = cartItems.map(mapCartItem);
  const totals = calculateTotals(items);

  return {
    items,
    totals: {
      subtotal: parseFloat(totals.subtotal.toFixed(2)),
      discount: parseFloat(totals.discount.toFixed(2)),
      total: parseFloat(totals.total.toFixed(2))
    }
  };
};

const resolveProductAndVariation = async (productId, variationId) => {
  const {Product, ProductVariation} = getModels();
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new CartError('Товар не найден', 404);
  }

  let variation = null;
  if (variationId) {
    variation = await ProductVariation.findByPk(variationId);
    if (!variation || Number(variation.product_id) !== Number(productId)) {
      throw new CartError('Неверная вариация товара', 400);
    }
  }

  return {product, variation};
};

const resolvePrice = (product, variation) => {
  const productPrice = Number(
    typeof product.getDataValue === 'function'
      ? product.getDataValue('price')
      : product.price
  ) || 0;

  if (!variation) {
    return productPrice;
  }

  const variationPrice = Number(
    typeof variation.getDataValue === 'function'
      ? variation.getDataValue('price')
      : variation.price
  );

  return !Number.isNaN(variationPrice) && variationPrice !== null
    ? variationPrice
    : productPrice;
};

const addItem = async ({userId, productId, variationId = null, quantity = 1, attributes = {}}) => {
  if (!productId) {
    throw new CartError('Не указан товар для добавления');
  }

  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw new CartError('Количество должно быть больше 0');
  }

  const {Cart, Product, ProductVariation} = getModels();
  const {product, variation} = await resolveProductAndVariation(productId, variationId);
  const price = resolvePrice(product, variation);

  const variationKey = variation
    ? (typeof variation.getDataValue === 'function'
        ? variation.getDataValue('id') ?? variationId ?? null
        : variation.id ?? variationId ?? null)
    : (variationId || null);

  const variationStoredPrice = variation
    ? (typeof variation.getDataValue === 'function'
        ? variation.getDataValue('price')
        : variation.price)
    : null;

  const defaults = {
    quantity: parsedQuantity,
    price_at_add: variationStoredPrice ?? price,
    discount_at_add: 0,
    attributes: attributes && typeof attributes === 'object' ? attributes : {}
  };

  const [cartItem, created] = await Cart.findOrCreate({
    where: {
      user_id: userId,
      product_id: productId,
      variation_id: variationKey
    },
    defaults
  });

  if (!created) {
    cartItem.quantity += parsedQuantity;
    cartItem.price_at_add = price;
    cartItem.attributes = defaults.attributes;
    if (typeof cartItem.save === 'function') {
      await cartItem.save();
    }
  }

  if (typeof cartItem.reload === 'function') {
    await cartItem.reload({
      include: [
        {model: Product, as: 'product', attributes: ['id', 'title', 'slug', 'price']},
        {model: ProductVariation, as: 'variation', attributes: ['id', 'sku', 'stock_quantity'], required: false}
      ]
    });
  }

  return {
    raw: cartItem,
    formatted: mapCartItem(cartItem)
  };
};

const updateItemQuantity = async ({userId, itemId, quantity}) => {
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw new CartError('Количество должно быть больше 0');
  }

  const {Cart, Product, ProductVariation} = getModels();
  const cartItem = await Cart.findOne({
    where: {id: itemId, user_id: userId},
    include: [
      {model: Product, as: 'product', attributes: ['id', 'title', 'slug', 'price']},
      {model: ProductVariation, as: 'variation', attributes: ['id', 'sku', 'stock_quantity'], required: false}
    ]
  });

  if (!cartItem) {
    throw new CartError('Элемент корзины не найден', 404);
  }

  cartItem.quantity = parsedQuantity;
  await cartItem.save();

  return mapCartItem(cartItem);
};

const removeItems = async ({userId, itemIds}) => {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return 0;
  }

  const {Cart} = getModels();
  return Cart.destroy({
    where: {
      user_id: userId,
      id: {
        [Op.in]: itemIds
      }
    }
  });
};

module.exports = {
  CartError,
  getCartItems,
  addItem,
  updateItemQuantity,
  removeItems,
  calculateTotals
};
