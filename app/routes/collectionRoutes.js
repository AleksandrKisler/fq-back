const router = require('express').Router();
const ctrl = require('../controllers/collectionController');

router.get('/collections', ctrl.list);
router.get('/collections/:id', ctrl.getOne);
router.post('/collections', ctrl.create);
router.put('/collections/:id', ctrl.update);
router.delete('/collections/:id', ctrl.remove);

// управление составом коллекции
router.post('/collections/:id/products', ctrl.addProducts);
router.delete('/collections/:id/products', ctrl.removeProducts);

module.exports = router;
