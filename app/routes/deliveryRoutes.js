const express = require('express');
const router = express.Router();
const cdekController = require('../controllers/cdekController');

router.get('/delivery/cdek/pvz', cdekController.getPickupPoints);
router.post('/delivery/cdek/tariff', cdekController.calculateTariff);

module.exports = router;
