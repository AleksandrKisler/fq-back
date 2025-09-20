const router = require('express').Router();
const selection = require('../controllers/selectionController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/selections', selection.list);
router.get('/selections/:idOrSlug', selection.getOne);
router.post('/selections', auth, requireAdmin, selection.create);
router.put('/selections/:idOrSlug', auth, requireAdmin, selection.update);
router.delete('/selections/:idOrSlug', auth, requireAdmin, selection.remove);

// управление составом
router.post('/selections/:id/products', auth, requireAdmin, selection.addProducts);
router.delete('/selections/:id/products', auth, requireAdmin, selection.removeProducts);

module.exports = router;
