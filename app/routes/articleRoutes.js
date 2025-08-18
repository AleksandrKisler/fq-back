// app/routes/articleRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/articleController');

router.get('/articles', ctrl.listArticles);
router.get('/articles/:idOrSlug', ctrl.getArticle);
router.post('/articles', ctrl.createArticle);
router.put('/articles/:idOrSlug', ctrl.updateArticle);
router.delete('/articles/:idOrSlug', ctrl.deleteArticle);

module.exports = router;
