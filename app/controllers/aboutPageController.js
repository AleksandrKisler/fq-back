const models = require('../models');
const sanitizeHtml = require('sanitize-html');
const { SANITIZE_OPTS } = require('./rulesController');
const { validateBlocks, sanitizeBlocks } = require('../utils/aboutPageBlocks');

const { Op } = models.Sequelize;

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const normalized = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return false;
};

function translit(s = '') {
  const m = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return String(s)
    .toLowerCase()
    .split('')
    .map((c) => m[c] ?? c)
    .join('');
}

function slugify(s = '') {
  const base = translit(s)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return base || 'about';
}

const cleanStr = (value) => (typeof value === 'string' ? value.trim() : value);

function normalizeBody(body = {}) {
  return {
    title: body.title,
    slug: body.slug,
    blocks: body.blocks,
  };
}

function validatePayload({ title, slug, blocks }, { requireTitle = false, requireBlocks = false } = {}) {
  const errors = [];
  if (requireTitle) {
    if (!isNonEmpty(title)) errors.push('Поле "title" обязательно');
  } else if (title !== undefined && !isNonEmpty(title)) {
    errors.push('Поле "title" не может быть пустым');
  }

  if (slug !== undefined && !isNonEmpty(slug)) {
    errors.push('Поле "slug" не может быть пустым');
  }

  if (blocks !== undefined) {
    const blockErrors = validateBlocks(blocks);
    errors.push(...blockErrors);
  } else if (requireBlocks) {
    errors.push('Поле "blocks" обязательно');
  }

  return errors;
}

const isNonEmpty = (v) => typeof v === 'string' ? v.trim().length > 0 : !!v;

async function ensureUniqueSlug(base, { excludeId } = {}) {
  const raw = cleanStr(base) || 'about';
  const initial = slugify(raw);
  const whereBase = excludeId ? { id: { [Op.ne]: excludeId } } : {};
  let attempt = initial;
  let counter = 1;

  // paranoid:false чтобы учитывать soft-deleted записи
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await models.AboutPage.findOne({
      where: { ...whereBase, slug: attempt },
      paranoid: false,
    });
    if (!existing) return attempt;
    attempt = `${initial}-${counter++}`;
  }
}

const toPlain = (instance) => {
  if (!instance) return instance;
  if (typeof instance.toJSON === 'function') return instance.toJSON();
  if (typeof instance.get === 'function') return instance.get();
  return instance;
};

exports.list = async (req, res) => {
  try {
    const q = cleanStr(req.query.q || '');
    const withDeleted = parseBool(req.query.withDeleted);
    const limit = Math.min(parseInt(req.query.limit || 20, 10), 100);
    const offset = parseInt(req.query.offset || 0, 10);

    const where = {};
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { count, rows } = await models.AboutPage.findAndCountAll({
      where,
      paranoid: !withDeleted,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ data: rows, total: count, limit, offset });
  } catch (e) {
    console.error('about.list error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении страниц About' });
  }
};

exports.getActive = async (_req, res) => {
  try {
    const page = await models.AboutPage.findOne({ where: { is_active: true } });
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Активная страница не найдена' });
    }
    res.json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.getActive error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении активной страницы' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const identifier = cleanStr(req.params.idOrSlug || '');
    const where = /^\d+$/.test(identifier)
      ? { id: Number(identifier) }
      : { slug: identifier };

    const page = await models.AboutPage.findOne({ where });
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    }
    res.json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.getOne error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении страницы' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = normalizeBody(req.body || {});
    const title = cleanStr(payload.title);
    const slug = cleanStr(payload.slug);
    const blocks = payload.blocks !== undefined ? payload.blocks : [];

    const errors = validatePayload({ title, slug, blocks }, { requireTitle: true, requireBlocks: true });
    if (errors.length) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors });
    }

    const finalSlug = await ensureUniqueSlug(slug || title);
    const sanitizedBlocks = sanitizeBlocks(blocks, sanitizeHtml, SANITIZE_OPTS);

    const page = await models.AboutPage.create({
      title: title.trim(),
      slug: finalSlug,
      blocks: sanitizedBlocks,
      is_active: false,
      published_at: null,
    });

    res.status(201).json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.create error:', e);
    if (e.name === 'ValidationError' || e.name === 'SequelizeValidationError') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: [e.message] });
    }
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Slug уже используется'] });
    }
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании страницы' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некорректный идентификатор'] });
    }

    const page = await models.AboutPage.findByPk(id);
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    }

    const payload = normalizeBody(req.body || {});
    const updates = {};

    if (payload.title !== undefined) {
      const title = cleanStr(payload.title);
      const errors = validatePayload({ title }, { requireTitle: true });
      if (errors.length) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', errors });
      }
      updates.title = title.trim();
    }

    if (payload.slug !== undefined) {
      const slug = cleanStr(payload.slug);
      const errors = validatePayload({ slug });
      if (errors.length) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', errors });
      }
      updates.slug = await ensureUniqueSlug(slug, { excludeId: page.id });
    }

    if (payload.blocks !== undefined) {
      const errors = validatePayload({ blocks: payload.blocks });
      if (errors.length) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', errors });
      }
      updates.blocks = sanitizeBlocks(payload.blocks, sanitizeHtml, SANITIZE_OPTS);
    }

    if (!Object.keys(updates).length) {
      return res.json({ page: toPlain(page) });
    }

    await page.update(updates);
    res.json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.update error:', e);
    if (e.name === 'ValidationError' || e.name === 'SequelizeValidationError') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: [e.message] });
    }
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Slug уже используется'] });
    }
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении страницы' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некорректный идентификатор'] });
    }

    const page = await models.AboutPage.findByPk(id);
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    }

    await page.destroy();
    res.status(204).send();
  } catch (e) {
    console.error('about.remove error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении страницы' });
  }
};

exports.restore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некорректный идентификатор'] });
    }

    const page = await models.AboutPage.findByPk(id, { paranoid: false });
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    }

    if (!page.deleted_at) {
      return res.json({ page: toPlain(page) });
    }

    await page.restore();
    res.json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.restore error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при восстановлении страницы' });
  }
};

exports.publish = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некорректный идентификатор'] });
    }

    const page = await models.AboutPage.findByPk(id, { paranoid: false });
    if (!page) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    }

    const publish = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'publish'))
      ? parseBool(req.body.publish)
      : true;

    await models.sequelize.transaction(async (transaction) => {
      if (publish) {
        await models.AboutPage.update({ is_active: false, published_at: null }, {
          where: { id: { [Op.ne]: page.id } },
          transaction,
        });
      }
      await page.update({
        is_active: publish,
        published_at: publish ? new Date() : null,
      }, { transaction });
    });

    await page.reload();
    res.json({ page: toPlain(page) });
  } catch (e) {
    console.error('about.publish error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при публикации страницы' });
  }
};
