const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rulesController');


// список/поиск/пагинация
router.get('/', ctrl.list);
// получить по id
router.get('/:id', ctrl.get);
// создать черновик
router.post('/', ctrl.create);
// обновить (title/content/slug)
router.patch('/:id', ctrl.update);
// опубликовать/снять с публикации
router.patch('/:id/publish', ctrl.publish);
// удалить
router.delete('/:id', ctrl.destroy);


module.exports = router;
