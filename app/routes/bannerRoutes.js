const router = require('express').Router();
const banner = require('../controllers/bannerController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/banners', banner.list);
router.get('/banners/:id', banner.getOne);
router.post('/banners', banner.create);
router.put('/banners/:id', banner.update);
router.delete('/banners/:id', banner.remove);

// NEW: восстановление soft-deleted записи
router.post('/banners/:id/restore', auth, requireAdmin, banner.restore);

module.exports = router;
