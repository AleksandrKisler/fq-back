const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rulesController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');


// список/поиск/пагинация
router.get('/', ctrl.list);
// получить по id
router.get('/:id', ctrl.get);
// создать черновик
router.post('/', auth, requireAdmin, ctrl.create);
// обновить (title/content/slug)
router.patch('/:id', auth, requireAdmin, ctrl.update);
// опубликовать/снять с публикации
router.patch('/:id/publish', auth, requireAdmin, ctrl.publish);
// удалить
router.delete('/:id', auth, requireAdmin, ctrl.destroy);


module.exports = router;
