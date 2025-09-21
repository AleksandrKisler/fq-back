const { Rule } = require('../models');
const { Op } = require('sequelize');
const sanitizeHtml = require('sanitize-html');

const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','u','s','img','span']),
  allowedAttributes: {
    a: ['href','name','target','rel'],
    img: ['src','alt','title'],
    span: ['style','class'],
    p: ['style','class'],
    h1: ['style','class'], h2: ['style','class'], h3: ['style','class'],
    '*': ['style']
  },
  allowedSchemesByTag: { img: ['http','https','data'] },
};

exports.SANITIZE_OPTS = SANITIZE_OPTS;

const cleanStr = (v) => typeof v === 'string' ? v.trim() : v;

exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const search = cleanStr(req.query.search || req.query.q || '');
    const status = cleanStr(req.query.status || ''); // 'published' | 'draft' | ''
    const publishedParam = req.query.is_published;   // 'true' | 'false' | undefined

    const where = {};
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    if (publishedParam === 'true') where.is_published = true;
    if (publishedParam === 'false') where.is_published = false;
    // совместимость со старым параметром status
    if (!('is_published' in where) && (status === 'published' || status === 'draft')) {
      where.is_published = (status === 'published');
    }

    const { rows, count } = await Rule.findAndCountAll({
      where,
      order: [['updated_at', 'DESC']],
      limit, offset,
    });

    res.json({ data: rows, meta: { page, limit, count } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

exports.get = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
};

exports.create = async (req, res) => {
  try {
    const title = cleanStr(req.body.title);
    const html = typeof req.body.content === 'string' ? req.body.content : '';
    if (!title || !html) {
      return res.status(400).json({ error: 'title and content are required' });
    }
    const content = sanitizeHtml(html, SANITIZE_OPTS);
    const rule = await Rule.create({
      title, content, is_published: false, published_at: null,
    });
    res.status(201).json({ data: rule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create rule' });
  }
};

exports.update = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Not found' });

    const next = {};
    if (req.body.title !== undefined) {
      const title = cleanStr(req.body.title);
      if (!title) return res.status(400).json({ error: 'title cannot be empty' });
      next.title = title;
    }
    if (typeof req.body.content === 'string') {
      next.content = sanitizeHtml(req.body.content, SANITIZE_OPTS);
    }
    // изменение публикации тут не делаем (есть отдельный publish)
    await rule.update(next);
    res.json({ data: rule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update rule' });
  }
};

exports.publish = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Not found' });

    const publish = !!req.body.publish;
    await rule.update({
      is_published: publish,
      published_at: publish ? new Date() : null,
    });
    res.json({ data: rule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to change publish state' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Not found' });
    await rule.destroy();
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
};
