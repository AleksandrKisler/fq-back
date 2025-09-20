// app/routes/articleRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/articleController');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/articles', ctrl.listArticles);
router.get('/articles/:idOrSlug', ctrl.getArticle);
router.post('/articles', auth, requireAdmin, ctrl.createArticle);
router.put('/articles/:idOrSlug', auth, requireAdmin, ctrl.updateArticle);
router.delete('/articles/:idOrSlug', auth, requireAdmin, ctrl.deleteArticle);

module.exports = router;
