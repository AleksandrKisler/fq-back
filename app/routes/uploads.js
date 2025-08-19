'use strict';

const router = require('express').Router();
const { uploadImage } = require('../controllers/uploadController');

router.post('/images', uploadImage);

module.exports = router;
