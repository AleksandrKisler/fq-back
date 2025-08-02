const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Список товаров с фильтрацией
router.post('/products', productController.getProducts);

// Получение одного товара
router.get('/products/:idOrSlug', productController.getProductExtended);

// Информация о категории
router.get('/products/categories/:idOrSlug', productController.getProductCategory);

// Похожие товары
router.get('/products/:idOrSlug/similar', productController.getSimilarProducts);

module.exports = router;