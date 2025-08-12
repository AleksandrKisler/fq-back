const { Wishlist, Product, Discount, AttributeValue, Attribute} = require('../models');
const {Op} = require("sequelize");

module.exports = {
  async addToFavorites(req, res) {
    try {
      const { id: productId } = req.body;
      const userId = req.user.id;

      // Проверка существования записи
      const existingItem = await Wishlist.findOne({
        where: {
          user_id: userId,
          product_id: productId
        }
      });

      if (existingItem) {
        return res.status(409).json({ error: 'Товар уже в избранном' });
      }

      // Создание новой записи
      await Wishlist.create({
        user_id: userId,
        product_id: productId,
        variation_id: null
      });

      res.status(204).end();
    } catch (error) {
      res.status(422).json({
        error: 'Ошибка добавления в избранное',
        message: error.message
      });
    }
  },

  // Удаление из избранного
  async removeFromFavorites(req, res) {
    try {
      const { id: productId } = req.body;
      const userId = req.user.id;

      const result = await Wishlist.destroy({
        where: {
          user_id: userId,
          product_id: productId
        }
      });

      if (result === 0) {
        return res.status(404).json({ error: 'Товар не найден в избранном' });
      }

      res.status(204).end();
    } catch (error) {
      res.status(422).json({
        error: 'Ошибка удаления из избранного',
        message: error.message
      });
    }
  },

  // Очистка всего избранного
  async clearFavorites(req, res) {
    try {
      const userId = req.user.id;

      await Wishlist.destroy({
        where: { user_id: userId }
      });

      res.status(204).end();
    } catch (error) {
      res.status(422).json({
        error: 'Ошибка очистки избранного',
        message: error.message
      });
    }
  },

  async getFavoritesInfo(req, res) {
    try {
      const userId = req.user.id;

      const count = await Wishlist.count({
        where: { user_id: userId }
      });

      res.status(200).json({
        info: {
          counter: count
        }
      });
    } catch (error) {
      res.status(422).json({
        error: 'Ошибка получения информации',
        message: error.message
      });
    }
  },

  async getFavorite(req, res){
    try {
      const userId = req.user.id;
      const {
        sort = 'added_at',     // Поле сортировки по умолчанию
        direction = 'DESC',     // Направление сортировки по умолчанию
        limit = 10,             // Лимит по умолчанию
        offset = 0              // Смещение по умолчанию
      } = req.query;

      // Валидация направления сортировки
      const validDirections = ['ASC', 'DESC'];
      if (!validDirections.includes(direction.toUpperCase())) {
        return res.status(422).json({
          error: 'Недопустимое направление сортировки',
          message: 'Допустимые значения: ASC, DESC'
        });
      }

      // Опции запроса
      const options = {
        where: { user_id: userId },
        include: [{
          model: Product,
          as: 'product',
          include: [
            {
              where: {is_active: true},
              model: Discount,
              as: 'discounts',
              through: {attributes: []},
              required: false
            },
            {
              model: AttributeValue,
              as: 'attributes',
              attributes: [],
              include: [{model: Attribute, as: 'attribute', attributes: []}]
            }

          ]// Используем alias, заданный в ассоциации
        }],
        order: [[sort, direction]],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        distinct: true           // Для корректного подсчета с JOIN
      };

      // Получаем данные и общее количество
      const { count, rows } = await Wishlist.findAndCountAll(options);

      // Формируем ответ
      res.status(200).json({
        data: rows.map(item => item.product), // Извлекаем продукты
        pagination: {
          total: count,
          limit: options.limit,
          offset: options.offset
        }
      });

    } catch (error) {
      console.error('Ошибка получения избранного:', error);
      res.status(422).json({
        error: 'Ошибка получения избранного',
        message: error.message
      });
    }
  }
};
