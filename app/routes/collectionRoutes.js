const router = require('express').Router();
const ctrl = require('../controllers/collectionController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/collections', ctrl.list);
router.get('/collections/:id', ctrl.getOne);
router.post('/collections', auth, requireAdmin, ctrl.create);
router.put('/collections/:id', auth, requireAdmin, ctrl.update);
router.delete('/collections/:id', auth, requireAdmin, ctrl.remove);

// управление составом коллекции
router.post('/collections/:id/products', auth, requireAdmin, ctrl.addProducts);
router.delete('/collections/:id/products', auth, requireAdmin, ctrl.removeProducts);

module.exports = router;
