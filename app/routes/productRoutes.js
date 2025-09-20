const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
// const auth = require('../middleware/authMiddleware');

router.post('/products', productController.getProducts);
router.get('/products/catalog', productController.getCatalog);
router.get('/products/:idOrSlug', productController.getProductExtended);
router.get('/products/categories/:idOrSlug', productController.getProductCategory);
router.get('/products/:idOrSlug/similar', productController.getSimilarProducts);
router.post('/products/by-ids', productController.getProductsByIds);

module.exports = router;
