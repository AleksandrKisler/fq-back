const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/auth', authController.login);
router.post('/refresh', authController.refresh);

module.exports = router;