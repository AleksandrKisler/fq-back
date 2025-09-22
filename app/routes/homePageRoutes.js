const router = require('express').Router();
const ctrl = require('../controllers/homePageController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/homepages', ctrl.list);
router.get('/homepages/active', ctrl.getActive);
router.get('/homepages/:idOrSlug', ctrl.getOne);

router.post('/homepages',   ctrl.create);
router.put('/homepages/:idOrSlug',   ctrl.update);
router.delete('/homepages/:id',   ctrl.remove);
router.post('/homepages/:id/restore',   ctrl.restore);
router.post('/homepages/:id/publish',   ctrl.publish);

module.exports = router;
