const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/admin/dashboard', auth, requireAdmin, dashboardController.getOverview);

module.exports = router;
