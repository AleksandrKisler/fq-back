const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/send', newsletterController.sendNewsletter);

module.exports = router;
