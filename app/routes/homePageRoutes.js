const router = require('express').Router();
const ctrl = require('../controllers/homePageController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/homepages', ctrl.list);
router.get('/homepages/active', ctrl.getActive);
router.get('/homepages/:idOrSlug', ctrl.getOne);

router.post('/homepages', auth, requireAdmin, ctrl.create);
router.put('/homepages/:idOrSlug', auth, requireAdmin, ctrl.update);
router.delete('/homepages/:id', auth, requireAdmin, ctrl.remove);
router.post('/homepages/:id/restore', auth, requireAdmin, ctrl.restore);
router.post('/homepages/:id/publish', auth, requireAdmin, ctrl.publish);

module.exports = router;
