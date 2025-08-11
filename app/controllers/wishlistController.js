const { Wishlist, User } = require('../models');

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
      res.status(200).json({
        message: 'success'
      })
    } catch (e) {
      res.status(422).json({
        error: 'Ошибка получения информации',
        message: error.message
      });
    }
  }
};
