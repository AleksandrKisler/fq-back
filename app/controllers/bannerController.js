const { Banner } = require('../models');

const TYPE_VALUES = ['PRODUCT', 'COLLECTION', 'INFORMATION', 'MAIN'];
const IMG_POS_VALUES = ['DEFAULT', 'LEFT', 'RIGHT'];

const parseBool = v => v === true || v === 'true' || v === 1 || v === '1';

function isValidUri(s='') {
  if (typeof s !== 'string' || !s.trim()) return false;
  if (s.startsWith('/')) return true;
  try { new URL(s); return true; } catch { return false; }
}

function normalize(body = {}) {
  const c = body.content || {};
  return {
    type:           body.type,
    title:          body.title ?? c.title,
    description:    body.description ?? c.description,
    source_id:      body.source_id ?? c.sourceId ?? null,
    image_position: body.image_position ?? c.imagePosition ?? null,
    image_url:      body.image_url ?? c.image,
    is_active:      typeof body.is_active !== 'undefined' ? parseBool(body.is_active) : undefined
  };
}

function validate(value, { requireAll = true } = {}) {
  const errors = [];

  if (!value.type || !TYPE_VALUES.includes(value.type)) {
    errors.push(`Поле "type" обязательно и должно быть одним из: ${TYPE_VALUES.join(', ')}`);
  }

  if (requireAll || value.title !== undefined) {
    if (!value.title || !String(value.title).trim()) {
      errors.push('Поле "content.title" обязательно для заполнения');
    }
  }

  if (requireAll || value.description !== undefined) {
    if (!value.description || !String(value.description).trim()) {
      errors.push('Поле "content.description" обязательно для заполнения');
    }
  }

  if (requireAll || value.image_url !== undefined) {
    if (!value.image_url || !isValidUri(value.image_url)) {
      errors.push('Поле "content.image" должно содержать корректный URL или путь от корня сайта (начиная с "/")');
    }
  }

  if (value.image_position != null && !IMG_POS_VALUES.includes(value.image_position)) {
    errors.push(`Поле "content.imagePosition" должно быть одним из: ${IMG_POS_VALUES.join(', ')}`);
  }

  return errors;
}

exports.create = async (req, res) => {
  try {
    const data = normalize(req.body);
    const errors = validate(data, { requireAll: true });
    if (errors.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors });

    const created = await Banner.create({
      type: data.type,
      title: data.title,
      description: data.description,
      source_id: data.source_id,
      image_position: data.image_position,
      image_url: data.image_url,
      is_active: data.is_active ?? false
    });

    res.status(201).json({ banner: created });
  } catch (e) {
    console.error('banners.create error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании баннера' });
  }
}

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Banner.findByPk(id);
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Баннер не найден' });

    const data = normalize(req.body);
    const errors = validate(data, { requireAll: false });
    if (errors.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors });

    if (data.type !== undefined)           item.type = data.type;
    if (data.title !== undefined)          item.title = data.title;
    if (data.description !== undefined)    item.description = data.description;
    if (data.source_id !== undefined)      item.source_id = data.source_id;
    if (data.image_position !== undefined) item.image_position = data.image_position;
    if (data.image_url !== undefined)      item.image_url = data.image_url;
    if (data.is_active !== undefined)      item.is_active = data.is_active;

    await item.save();
    res.json({ banner: item });
  } catch (e) {
    console.error('banners.update error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении баннера' });
  }
}

exports.list = async (req, res) => {
  try {
    const q        = (req.query.q || '').trim();
    const type     = (req.query.type || '').trim();
    const isActive = (typeof req.query.is_active !== 'undefined')
      ? (req.query.is_active === 'true' || req.query.is_active === '1' || req.query.is_active === true)
      : undefined;
    const withDeleted = req.query.withDeleted === 'true' || req.query.withDeleted === '1';

    const limit  = Math.min(parseInt(req.query.limit || 20), 100);
    const offset = parseInt(req.query.offset || 0);

    const where = {};
    if (q) where[Op.or] = [
      { title:       { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } }
    ];
    if (type) where.type = type;
    if (typeof isActive !== 'undefined') where.is_active = isActive;

    const { count, rows } = await Banner.findAndCountAll({
      where,
      paranoid: !withDeleted,              // <-- включаем удалённые при необходимости
      order: [['created_at', 'DESC']],
      limit, offset
    });

    res.json({ data: rows, total: count, limit, offset });
  } catch (e) {
    console.error('banners.list error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении баннеров' });
  }
}

exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const withDeleted = req.query.withDeleted === 'true' || req.query.withDeleted === '1';

    const item = await Banner.findByPk(id, { paranoid: !withDeleted });
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Баннер не найден' });

    res.json({ banner: item });
  } catch (e) {
    console.error('banners.getOne error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении баннера' });
  }
}

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const n = await Banner.destroy({where: {id}}); // paranoid=true => soft delete
    if (!n) return res.status(404).json({code: 'NOT_FOUND', message: 'Баннер не найден'});
    res.status(204).send();
  } catch (e) {
    console.error('banners.remove error:', e);
    res.status(500).json({code: 'SERVER_ERROR', message: 'Ошибка при удалении баннера'});
  }
}

exports.restore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Banner.findByPk(id, { paranoid: false });
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Баннер не найден' });
    await item.restore(); // снимет deleted_at
    res.json({ banner: item });
  } catch (e) {
    console.error('banners.restore error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при восстановлении баннера' });
  }
};
