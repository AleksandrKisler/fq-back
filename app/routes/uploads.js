'use strict';

const router = require('express').Router();
const { uploadImage } = require('../controllers/uploadController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.post('/images', uploadImage);

module.exports = router;
