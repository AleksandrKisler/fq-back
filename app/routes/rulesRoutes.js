const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rulesController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');


router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/publish', ctrl.publish);
// удалить
router.delete('/:id', ctrl.destroy);


module.exports = router;
