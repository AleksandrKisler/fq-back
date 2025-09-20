const {Cart, Product, ProductVariation} = require('../models');
const {Op} = require('sequelize');
// Получение корзины пользователя
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id; // ID из аутентификации

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

    const plainItems = cartItems.map(item =>
      typeof item.get === 'function' ? item.get({plain: true}) : item
    );

    // Расчет итогов
    const {total, discount, totalWithDiscount} = plainItems.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price_at_add) || 0;
        const discountValue = Number(item.discount_at_add) || 0;
        const itemTotal = price * quantity;
        const itemDiscount = discountValue * quantity;
        return {
          total: acc.total + itemTotal,
          discount: acc.discount + itemDiscount,
          totalWithDiscount: acc.totalWithDiscount + (itemTotal - itemDiscount)
        };
      },
      {total: 0, discount: 0, totalWithDiscount: 0}
    );

    const responseItems = plainItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price_at_add: item.price_at_add,
      discount_at_add: item.discount_at_add,
      attributes: item.attributes,
      product: item.product,
      variation: item.variation
    }));

    return res.json({
      success: true,
      data: {
        items: responseItems,
        total: parseFloat(total.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        totalWithDiscount: parseFloat(totalWithDiscount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении корзины'
    });
  }
}

// Добавление товара в корзину
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {productId, variationId, quantity = 1} = req.body;
    console.log(productId, variationId);

    // Проверка существования товара
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    // Проверка вариации
    let variationPrice = product.price;
    if (variationId) {
      const variation = await ProductVariation.findByPk(variationId);
      if (!variation || variation.productId === productId) {
        return res.status(400).json({
          success: false,
          message: 'Неверная вариация товара'
        });
      }
    }

    // Расчет скидки (заглушка - здесь должна быть реальная логика)
    const discount = 0; // TODO: Реализовать расчет скидки

    // Создание/обновление записи
    const [cartItem, created] = await Cart.findOrCreate({
      where: {
        user_id: userId,
        product_id: productId,
        variation_id: variationId || null
      },
      defaults: {
        quantity,
        price_at_add: variationPrice,
        discount_at_add: discount,
        attributes: JSON.stringify({'test-attributes': 'a'})
      }
    });

    // Если не создана новая - обновляем количество
    if (!created) {
      cartItem.quantity += quantity;
      await cartItem.save();
    }

    return res.json({
      success: true,
      message: 'Товар добавлен в корзину',
      data: cartItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении в корзину'
    });
  }
}

exports.updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {itemId} = req.params;
    const {quantity} = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Количество должно быть больше 0'
      });
    }

    const cartItem = await Cart.findOne({
      where: {id: itemId, user_id: userId}
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Элемент корзины не найден'
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.json({
      success: true,
      message: 'Количество обновлено',
      data: cartItem
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении корзины'
    });
  }
}

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const {itemIds} = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.json({
        success: true,
        message: 'Корзина очищена'
      });
    }

    await Cart.destroy({
      where: {
        user_id: userId,
        id: {
          [Op.in]: itemIds
        }
      }
    });

    return res.json({
      success: true,
      message: 'Корзина очищена'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при очистке корзины'
    });
  }
}

