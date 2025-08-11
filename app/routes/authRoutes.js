const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/auth', authController.login);
router.post('/refresh', authController.refresh);
router.post('/register-auth', authController.createAnonymousUser);
router.post('/anonymous-regular', authController.convertToRegularUser);

module.exports = router;
