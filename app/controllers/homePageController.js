const { HomePage, HomeBannerSlot, HomeSelectionSlot, Banner, Selection, Sequelize } = require('../models');
const { Op } = require('sequelize');

const BANNER_SLOTS = ['main','slot-1','slot-2','slot-3'];
const SELECTION_SLOTS = ['slot-1','slot-2','slot-3'];

const parseBool = v => v === true || v === 'true' || v === 1 || v === '1';

function translit(s=''){const m={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};return String(s).toLowerCase().split('').map(c=>m[c]??c).join('')}
function slugify(s=''){return translit(s).replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80)}

function normalizeBody(body = {}) {
  return {
    title: body.title,
    slug:  body.slug,
    is_active: typeof body.is_active !== 'undefined' ? parseBool(body.is_active) : undefined,
    banners: body.banners || {},
    selections: body.selections || {}
  };
}

function validatePayload({ title, slug, banners, selections }, { requireAllSlots = true } = {}) {
  const errors = [];
  if (!title || !String(title).trim()) errors.push('Поле "title" обязательно');
  if (slug !== undefined && !String(slug).trim()) errors.push('Поле "slug" не может быть пустым');

  const checkSlots = (obj, allowed, name) => {
    const keys = Object.keys(obj || {});
    if (requireAllSlots) {
      const missing = allowed.filter(s => !(s in obj));
      if (missing.length) errors.push(`Отсутствуют обязательные слоты ${name}: ${missing.join(', ')}`);
    }
    const unknown = keys.filter(k => !allowed.includes(k));
    if (unknown.length) errors.push(`Неизвестные слоты ${name}: ${unknown.join(', ')}`);
  };

  checkSlots(banners, BANNER_SLOTS, 'banners');
  checkSlots(selections, SELECTION_SLOTS, 'selections');

  for (const [slot, id] of Object.entries(banners || {})) {
    if (id == null || isNaN(Number(id))) errors.push(`banners.${slot}: требуется корректный banner_id`);
  }
  for (const [slot, id] of Object.entries(selections || {})) {
    if (id == null || isNaN(Number(id))) errors.push(`selections.${slot}: требуется корректный selection_id`);
  }

  return errors;
}

async function ensureUniqueSlug(base) {
  const raw = base?.trim() || 'home';
  let s = slugify(raw);
  let i = 1;
  while (await HomePage.findOne({ where: { slug: s }, paranoid: false })) {
    s = `${slugify(raw)}-${++i}`;
  }
  return s;
}

// Список
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const withDeleted = parseBool(req.query.withDeleted);
    const limit  = Math.min(parseInt(req.query.limit || 20), 100);
    const offset = parseInt(req.query.offset || 0);

    const where = {};
    if (q) where[Op.or] = [{ title: { [Op.iLike]: `%${q}%` } }, { slug: { [Op.iLike]: `%${q}%` } }];

    const { count, rows } = await HomePage.findAndCountAll({
      where,
      paranoid: !withDeleted,
      order: [['created_at','DESC']],
      limit, offset
    });

    res.json({ data: rows, total: count, limit, offset });
  } catch (e) {
    console.error('home.list error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении страниц' });
  }
};

// Получить активную страницу в «собранном» виде
exports.getActive = async (_req, res) => {
  try {
    const page = await HomePage.findOne({
      where: { is_active: true },
      include: [
        { model: HomeBannerSlot, as: 'bannerSlots', include: [{ model: Banner, as: 'banner' }] },
        { model: HomeSelectionSlot, as: 'selectionSlots', include: [{ model: Selection, as: 'selection' }] }
      ]
    });
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Активная страница не найдена' });

    const banners = {};
    for (const s of page.bannerSlots) banners[s.slot] = s.banner;
    const selections = {};
    for (const s of page.selectionSlots) selections[s.slot] = s.selection;

    res.json({ page: { id: page.id, title: page.title, slug: page.slug, published_at: page.published_at, banners, selections } });
  } catch (e) {
    console.error('home.getActive error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении активной страницы' });
  }
};

// Получить по id/slug
exports.getOne = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };

    const page = await HomePage.findOne({
      where,
      include: [
        { model: HomeBannerSlot, as: 'bannerSlots', include: [{ model: Banner, as: 'banner' }] },
        { model: HomeSelectionSlot, as: 'selectionSlots', include: [{ model: Selection, as: 'selection' }] }
      ]
    });
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });

    const banners = {}; for (const s of page.bannerSlots) banners[s.slot] = s.banner;
    const selections = {}; for (const s of page.selectionSlots) selections[s.slot] = s.selection;

    res.json({ page: { id: page.id, title: page.title, slug: page.slug, is_active: page.is_active, published_at: page.published_at, banners, selections } });
  } catch (e) {
    console.error('home.getOne error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении страницы' });
  }
};

// Создать (все слоты обязательны)
exports.create = async (req, res) => {
  const t = await HomePage.sequelize.transaction();
  try {
    const payload = normalizeBody(req.body);
    const errors = validatePayload(payload, { requireAllSlots: true });
    if (errors.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors });

    // проверяем существование ссылок
    const bannerIds = Object.values(payload.banners).map(Number);
    const selectionIds = Object.values(payload.selections).map(Number);
    const bCount = await Banner.count({ where: { id: { [Op.in]: bannerIds } } });
    const sCount = await Selection.count({ where: { id: { [Op.in]: selectionIds } } });
    if (bCount !== bannerIds.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некоторые баннеры не найдены'] });
    if (sCount !== selectionIds.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors: ['Некоторые подборки не найдены'] });

    const slug = await ensureUniqueSlug(payload.slug || payload.title);
    const page = await HomePage.create({
      title: payload.title.trim(),
      slug,
      is_active: !!payload.is_active,
      published_at: payload.is_active ? new Date() : null
    }, { transaction: t });

    // если активируем — деактивируем остальные (сработает и partial unique индекс)
    if (page.is_active) {
      await HomePage.update({ is_active: false }, { where: { id: { [Op.ne]: page.id } }, transaction: t });
    }

    // слоты
    const bannerRows = BANNER_SLOTS.map(slot => ({
      page_id: page.id, slot, banner_id: Number(payload.banners[slot])
    }));
    const selectionRows = SELECTION_SLOTS.map(slot => ({
      page_id: page.id, slot, selection_id: Number(payload.selections[slot])
    }));
    await HomeBannerSlot.bulkCreate(bannerRows,   { transaction: t });
    await HomeSelectionSlot.bulkCreate(selectionRows, { transaction: t });

    await t.commit();
    req.params.idOrSlug = page.id; // для повторного использования getOne
    return exports.getOne(req, res);
  } catch (e) {
    await t.rollback();
    console.error('home.create error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании страницы' });
  }
};

// Обновить (частично)
exports.update = async (req, res) => {
  const t = await HomePage.sequelize.transaction();
  try {
    const idOrSlug = req.params.idOrSlug;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const page = await HomePage.findOne({ where });
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });

    const payload = normalizeBody(req.body);
    const errors = validatePayload(payload, { requireAllSlots: false });
    if (errors.length) return res.status(400).json({ code: 'VALIDATION_ERROR', errors });

    if (payload.title !== undefined) page.title = payload.title.trim();
    if (payload.slug  !== undefined) page.slug  = await ensureUniqueSlug(payload.slug);
    if (payload.is_active !== undefined) page.is_active = !!payload.is_active;
    if (payload.is_active) page.published_at = new Date();

    await page.save({ transaction: t });

    // Пересобрать слоты (только переданные)
    if (payload.banners && Object.keys(payload.banners).length) {
      for (const [slot, banner_id] of Object.entries(payload.banners)) {
        if (!BANNER_SLOTS.includes(slot)) continue;
        await HomeBannerSlot.upsert({ page_id: page.id, slot, banner_id: Number(banner_id) }, { transaction: t });
      }
    }
    if (payload.selections && Object.keys(payload.selections).length) {
      for (const [slot, selection_id] of Object.entries(payload.selections)) {
        if (!SELECTION_SLOTS.includes(slot)) continue;
        await HomeSelectionSlot.upsert({ page_id: page.id, slot, selection_id: Number(selection_id) }, { transaction: t });
      }
    }

    // единственная активная
    if (page.is_active) {
      await HomePage.update({ is_active: false }, { where: { id: { [Op.ne]: page.id } }, transaction: t });
    }

    await t.commit();
    req.params.idOrSlug = page.id;
    return exports.getOne(req, res);
  } catch (e) {
    await t.rollback();
    console.error('home.update error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении страницы' });
  }
};

// Удалить (soft delete)
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const page = await HomePage.findByPk(id);
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    await page.destroy();
    res.status(204).send();
  } catch (e) {
    console.error('home.remove error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении страницы' });
  }
};

// Восстановить
exports.restore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const page = await HomePage.findByPk(id, { paranoid: false });
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });
    await page.restore();
    res.json({ page });
  } catch (e) {
    console.error('home.restore error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при восстановлении страницы' });
  }
};

// Сделать активной (публикация)
exports.publish = async (req, res) => {
  const t = await HomePage.sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const page = await HomePage.findByPk(id);
    if (!page) return res.status(404).json({ code: 'NOT_FOUND', message: 'Страница не найдена' });

    await HomePage.update({ is_active: false }, { where: { id: { [Op.ne]: id } }, transaction: t });
    page.is_active = true;
    page.published_at = new Date();
    await page.save({ transaction: t });
    await t.commit();

    req.params.idOrSlug = id;
    return exports.getOne(req, res);
  } catch (e) {
    await t.rollback();
    console.error('home.publish error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при публикации страницы' });
  }
};
