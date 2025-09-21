const cartService = require('../services/cartService');

// Получение корзины пользователя
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const {items, totals} = await cartService.getCartItems(userId);

    return res.json({
      success: true,
      data: {
        items,
        total: totals.subtotal,
        discount: totals.discount,
        totalWithDiscount: totals.total
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Ошибка при получении корзины'
    });
  }
};

// Добавление товара в корзину
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {productId, variationId, quantity = 1, attributes = {}} = req.body;

    const {raw, formatted} = await cartService.addItem({
      userId,
      productId,
      variationId,
      quantity,
      attributes
    });

    return res.json({
      success: true,
      message: 'Товар добавлен в корзину',
      data: raw,
      meta: {
        item: formatted
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Ошибка при добавлении в корзину'
    });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {itemId} = req.params;
    const {quantity} = req.body;

    const item = await cartService.updateItemQuantity({
      userId,
      itemId,
      quantity
    });

    return res.json({
      success: true,
      message: 'Количество обновлено',
      data: item
    });
  } catch (error) {
    console.error('Update cart error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Ошибка при обновлении корзины'
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const {itemIds} = req.body;

    await cartService.removeItems({userId, itemIds});

    return res.json({
      success: true,
      message: 'Корзина очищена'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Ошибка при очистке корзины'
    });
  }
};

