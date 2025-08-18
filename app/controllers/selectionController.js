const { Selection, Product, SelectionProduct, Sequelize } = require('../models');
const { Op } = require('sequelize');

// простая генерация slug
function translit(str='') {
  const m = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  return String(str).toLowerCase().split('').map(ch => m[ch] ?? ch).join('');
}
function slugify(title='') {
  return translit(title).replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80);
}
async function ensureUniqueSlug(base) {
  let s = base || 'selection';
  let i = 1;
  while (await Selection.findOne({ where: { slug: s } })) s = `${base}-${++i}`;
  return s;
}

// LIST
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const isActive = (typeof req.query.is_active !== 'undefined')
      ? (req.query.is_active === 'true' || req.query.is_active === '1' || req.query.is_active === true)
      : undefined;
    const withProducts = req.query.withProducts === 'true' || req.query.withProducts === '1';
    const limit  = Math.min(parseInt(req.query.limit || 20), 100);
    const offset = parseInt(req.query.offset || 0);

    const where = {};
    if (q) where[Op.or] = [{ title: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }];
    if (typeof isActive !== 'undefined') where.is_active = isActive;

    const include = [];
    if (withProducts) {
      include.push({
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: ['id', 'title', 'sku', 'slug', 'price']
      });
    }

    const { count, rows } = await Selection.findAndCountAll({
      where,
      include,
      order: [['id','DESC']],
      limit, offset,
      distinct: true
    });

    res.json({ data: rows, total: count, limit, offset });
  } catch (e) {
    console.error('selections.list error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении подборок' });
  }
};

// GET one
exports.getOne = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };

    const item = await Selection.findOne({
      where,
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: ['id','title','sku','slug','price']
      }]
    });
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Подборка не найдена' });
    res.json({ selection: item });
  } catch (e) {
    console.error('selections.getOne error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении подборки' });
  }
};

// CREATE
exports.create = async (req, res) => {
  const t = await Selection.sequelize.transaction();
  try {
    const { title, slug, description = null, is_active = false, productIds = [] } = req.body || {};
    if (!title) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Поле "title" обязательно' });

    const uniqueSlug = await ensureUniqueSlug(slug?.trim() || slugify(title));
    const selection = await Selection.create(
      { title, slug: uniqueSlug, description, is_active: !!is_active },
      { transaction: t }
    );

    if (Array.isArray(productIds) && productIds.length) {
      const rows = productIds.map(pid => ({ collection_id: selection.id, product_id: Number(pid) }));
      await SelectionProduct.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
    }

    await t.commit();
    const created = await Selection.findByPk(selection.id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.status(201).json({ selection: created });
  } catch (e) {
    await t.rollback();
    console.error('selections.create error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании подборки' });
  }
};

// UPDATE
exports.update = async (req, res) => {
  const t = await Selection.sequelize.transaction();
  try {
    const idOrSlug = req.params.idOrSlug;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const selection = await Selection.findOne({ where });
    if (!selection) return res.status(404).json({ code: 'NOT_FOUND', message: 'Подборка не найдена' });

    const { title, slug, description, is_active, productIds } = req.body || {};

    if (typeof title !== 'undefined') selection.title = title;
    if (typeof description !== 'undefined') selection.description = description;
    if (typeof is_active !== 'undefined') selection.is_active = !!is_active;

    if (typeof slug !== 'undefined') {
      const s = await ensureUniqueSlug(slug.trim() || slugify(selection.title));
      selection.slug = s;
    }

    await selection.save({ transaction: t });

    if (Array.isArray(productIds)) {
      // Полная переустановка состава товаров
      await SelectionProduct.destroy({ where: { collection_id: selection.id }, transaction: t });
      if (productIds.length) {
        const rows = productIds.map(pid => ({ collection_id: selection.id, product_id: Number(pid) }));
        await SelectionProduct.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
      }
    }

    await t.commit();
    const updated = await Selection.findByPk(selection.id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.json({ selection: updated });
  } catch (e) {
    await t.rollback();
    console.error('selections.update error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении подборки' });
  }
};

// DELETE (жёстко удаляем саму подборку и связи)
exports.remove = async (req, res) => {
  const t = await Selection.sequelize.transaction();
  try {
    const idOrSlug = req.params.idOrSlug;
    const where = isNaN(idOrSlug) ? { slug: idOrSlug } : { id: Number(idOrSlug) };
    const selection = await Selection.findOne({ where });
    if (!selection) return res.status(404).json({ code: 'NOT_FOUND', message: 'Подборка не найдена' });

    await SelectionProduct.destroy({ where: { collection_id: selection.id }, transaction: t });
    await selection.destroy({ transaction: t });
    await t.commit();
    res.status(204).send();
  } catch (e) {
    await t.rollback();
    console.error('selections.remove error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении подборки' });
  }
};

// Добавить товары в подборку
exports.addProducts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const selection = await Selection.findByPk(id);
    if (!selection) return res.status(404).json({ code: 'NOT_FOUND', message: 'Подборка не найдена' });

    const { productIds = [] } = req.body || {};
    if (!Array.isArray(productIds) || !productIds.length) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Нужен массив productIds' });
    }
    const rows = productIds.map(pid => ({ collection_id: id, product_id: Number(pid) }));
    await SelectionProduct.bulkCreate(rows, { ignoreDuplicates: true });

    const updated = await Selection.findByPk(id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.json({ selection: updated });
  } catch (e) {
    console.error('selections.addProducts error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при добавлении товаров в подборку' });
  }
};

// Удалить товары из подборки
exports.removeProducts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { productIds = [] } = req.body || {};
    if (!Array.isArray(productIds) || !productIds.length) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Нужен массив productIds' });
    }
    const n = await SelectionProduct.destroy({
      where: { collection_id: id, product_id: { [Op.in]: productIds.map(Number) } }
    });
    res.json({ removed: n });
  } catch (e) {
    console.error('selections.removeProducts error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении товаров из подборки' });
  }
};
