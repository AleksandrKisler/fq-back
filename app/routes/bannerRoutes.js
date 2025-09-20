const router = require('express').Router();
const banner = require('../controllers/bannerController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/banners', banner.list);
router.get('/banners/:id', banner.getOne);
router.post('/banners', auth, requireAdmin, banner.create);
router.put('/banners/:id', auth, requireAdmin, banner.update);
router.delete('/banners/:id', auth, requireAdmin, banner.remove);

// NEW: восстановление soft-deleted записи
router.post('/banners/:id/restore', auth, requireAdmin, banner.restore);

module.exports = router;
