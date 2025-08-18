// app/controllers/articleController.js
const { Article } = require('../models');
const { Op } = require('sequelize');

// простая генерация slug (кириллица -> латиница + дефисы)
function translit(str='') {
  const map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  return String(str).toLowerCase().split('').map(ch => map[ch] ?? ch).join('');
}
function slugify(title='') {
  return translit(title)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ensure unique slug
async function ensureUniqueSlug(base) {
  let s = base || 'article';
  let i = 1;
  while (await Article.findOne({ where: { slug: s }, paranoid: false })) {
    s = `${base}-${++i}`;
  }
  return s;
}

// CREATE
exports.createArticle = async (req, res) => {
  try {
    const {
      title, slug, excerpt = null, content,
      main_image = null, is_active = false,
      publish_date, meta_title = null, meta_description = null
    } = req.body || {};

    if (!title || !content || !publish_date) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title, content, publish_date обязательны' });
    }

    const baseSlug = slug?.trim() || slugify(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const article = await Article.create({
      title,
      slug: uniqueSlug,
      excerpt,
      content,
      main_image,
      is_active: !!is_active,
      publish_date,
      meta_title,
      meta_description
    });

    res.status(201).json({ article });
  } catch (e) {
    console.error('createArticle error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании статьи' });
  }
};

// LIST (поиск/пагинация/фильтры)
exports.listArticles = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || 20), 100);
    const offset = parseInt(req.query.offset || 0);
    const is_active = req.query.is_active;

    const where = {};
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { excerpt: { [Op.iLike]: `%${q}%` } },
        { content: { [Op.iLike]: `%${q}%` } }
      ];
    }
    if (is_active === 'true' || is_active === 'false') {
      where.is_active = is_active === 'true';
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      order: [['publish_date', 'DESC'], ['created_at', 'DESC']],
      limit, offset
    });

    res.json({ data: rows, limit, offset, total: count });
  } catch (e) {
    console.error('listArticles error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении статей' });
  }
};

// GET one by id or slug
exports.getArticle = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const article = await Article.findOne({ where });

    if (!article) return res.status(404).json({ code: 'NOT_FOUND', message: 'Статья не найдена' });
    res.json({ article });
  } catch (e) {
    console.error('getArticle error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении статьи' });
  }
};

// UPDATE
exports.updateArticle = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const article = await Article.findOne({ where });
    if (!article) return res.status(404).json({ code: 'NOT_FOUND', message: 'Статья не найдена' });

    const {
      title, slug, excerpt, content,
      main_image, is_active, publish_date,
      meta_title, meta_description
    } = req.body || {};

    if (title) article.title = title;
    if (typeof excerpt !== 'undefined') article.excerpt = excerpt;
    if (typeof content !== 'undefined') article.content = content;
    if (typeof main_image !== 'undefined') article.main_image = main_image;
    if (typeof is_active !== 'undefined') article.is_active = !!is_active;
    if (typeof publish_date !== 'undefined') article.publish_date = publish_date;
    if (typeof meta_title !== 'undefined') article.meta_title = meta_title;
    if (typeof meta_description !== 'undefined') article.meta_description = meta_description;

    if (slug) {
      const baseSlug = slugify(slug);
      article.slug = await ensureUniqueSlug(baseSlug);
    } else if (title) {
      // если изменили заголовок и slug не прислали — обновим автоматом
      const baseSlug = slugify(title);
      if (baseSlug && baseSlug !== article.slug) {
        article.slug = await ensureUniqueSlug(baseSlug);
      }
    }

    await article.save();
    res.json({ article });
  } catch (e) {
    console.error('updateArticle error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении статьи' });
  }
};

// DELETE (мягкое удаление, т.к. paranoid)
exports.deleteArticle = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const article = await Article.findOne({ where });
    if (!article) return res.status(404).json({ code: 'NOT_FOUND', message: 'Статья не найдена' });

    await article.destroy(); // paranoid => запишет deleted_at
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteArticle error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении статьи' });
  }
};
