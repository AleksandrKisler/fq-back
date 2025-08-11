const { Cart, Product, ProductVariation } = require('../models');

  // Получение корзины пользователя
exports.getCart = async (req, res) => {
    try {
      const userId = req.user.id; // ID из аутентификации

      const cartItems = await Cart.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'title', 'slug', 'price']
          },
          {
            model: ProductVariation,
            as: 'variation',
            attributes: ['id', 'sku', 'attributes']
          }
        ],
        order: [['added_at', 'DESC']]
      });

      // Расчет итогов
      const { total, discount, totalWithDiscount } = cartItems.reduce(
        (acc, item) => {
          const itemTotal = item.price_at_add * item.quantity;
          const itemDiscount = item.discount_at_add * item.quantity;
          return {
            total: acc.total + itemTotal,
            discount: acc.discount + itemDiscount,
            totalWithDiscount: acc.totalWithDiscount + (itemTotal - itemDiscount)
          };
        },
        { total: 0, discount: 0, totalWithDiscount: 0 }
      );

      return res.json({
        success: true,
        data: {
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price_at_add: item.price_at_add,
            discount_at_add: item.discount_at_add,
            attributes: item.attributes,
            product: item.product,
            variation: item.variation
          })),
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
      const { productId, variationId, quantity = 1, attributes } = req.body;

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
      if (variation_id) {
        const variationId = await ProductVariation.findByPk(variationId);
        if (!variation || variation.product_id !== productId) {
          return res.status(400).json({
            success: false,
            message: 'Неверная вариация товара'
          });
        }
        variationPrice = variation.price;
      }

      // Расчет скидки (заглушка - здесь должна быть реальная логика)
      const discount = 0; // TODO: Реализовать расчет скидки

      // Создание/обновление записи
      const [cartItem, created] = await Cart.findOrCreate({
        where: {
          user_id: userId,
          productId,
          variation_id: variationId || null
        },
        defaults: {
          quantity,
          price_at_add: variationPrice,
          discount_at_add: discount,
          attributes
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
      const { id } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Количество должно быть больше 0'
        });
      }

      const cartItem = await Cart.findOne({
        where: { id, user_id: userId }
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

exports.removeItem = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Cart.destroy({
        where: { id, user_id: userId }
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Элемент корзины не найден'
        });
      }

      return res.json({
        success: true,
        message: 'Товар удален из корзины'
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при удалении из корзины'
      });
    }
  }

exports.clearCart = async (req, res) => {
     try {
      const userId = req.user.id;

      await Cart.destroy({
        where: { user_id: userId }
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

