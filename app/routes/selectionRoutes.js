const router = require('express').Router();
const selection = require('../controllers/selectionController');

router.get('/selections', selection.list);
router.get('/selections/:idOrSlug', selection.getOne);
router.post('/selections', selection.create);
router.put('/selections/:idOrSlug', selection.update);
router.delete('/selections/:idOrSlug', selection.remove);

// управление составом
router.post('/selections/:id/products', selection.addProducts);
router.delete('/selections/:id/products', selection.removeProducts);

module.exports = router;
