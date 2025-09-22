const router = require('express').Router();
const ctrl = require('../controllers/aboutPageController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/about-pages', ctrl.list);
router.get('/about-pages/active', ctrl.getActive);
router.get('/about-pages/:idOrSlug', ctrl.getOne);

router.post('/about-pages', ctrl.create);
router.put('/about-pages/:id', ctrl.update);
router.delete('/about-pages/:id', ctrl.remove);
router.post('/about-pages/:id/restore', ctrl.restore);
router.post('/about-pages/:id/publish', ctrl.publish);

module.exports = router;
