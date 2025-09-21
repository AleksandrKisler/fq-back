const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/orders/checkout', auth, orderController.checkout);
router.get('/orders/:slug', auth, orderController.getOrder);
router.post('/payments/yookassa/webhook', orderController.handleWebhook);

module.exports = router;
