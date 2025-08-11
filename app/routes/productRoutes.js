const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');

router.post('/products', auth, productController.getProducts);
router.get('/products/catalog', auth, productController.getCatalog);
router.get('/products/:idOrSlug', auth, productController.getProductExtended);
router.get('/products/categories/:idOrSlug', auth, productController.getProductCategory);
router.get('/products/:idOrSlug/similar', auth, productController.getSimilarProducts);

module.exports = router;
