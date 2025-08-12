const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

router.get('/cart', auth, cartController.getCart);
router.post('/cart/add', auth, cartController.addItem)
router.post('/cart/:itemId/quantity', auth, cartController.updateItem)
router.post('/cart/remove', auth, cartController.clearCart)

module.exports = router;
