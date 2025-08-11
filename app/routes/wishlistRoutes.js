const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

router.post('/user/favorites/products', auth, wishlistController.getFavorite);
router.post('/user/favorites/add', auth, wishlistController.addToFavorites);
router.post('/user/favorites/remove', auth, wishlistController.removeFromFavorites);
router.post('/user/favorites/remove/all', auth, wishlistController.clearFavorites);
router.get('/user/favorites/info', auth, wishlistController.getFavoritesInfo);

module.exports = router;
