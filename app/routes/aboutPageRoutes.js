const router = require('express').Router();
const ctrl = require('../controllers/aboutPageController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/about-pages', ctrl.list);
router.get('/about-pages/active', ctrl.getActive);
router.get('/about-pages/:idOrSlug', ctrl.getOne);

router.post('/about-pages', auth, requireAdmin, ctrl.create);
router.put('/about-pages/:id', auth, requireAdmin, ctrl.update);
router.delete('/about-pages/:id', auth, requireAdmin, ctrl.remove);
router.post('/about-pages/:id/restore', auth, requireAdmin, ctrl.restore);
router.post('/about-pages/:id/publish', auth, requireAdmin, ctrl.publish);

module.exports = router;
