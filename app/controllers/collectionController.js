const { Collection, Product, CollectionProduct } = require('../models');
const { Op } = require('sequelize');

const parseBool = v => v === true || v === 'true' || v === 1 || v === '1';

// LIST
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const isActive = (typeof req.query.is_active !== 'undefined')
      ? parseBool(req.query.is_active)
      : undefined;
    const withProducts = req.query.withProducts === 'true' || req.query.withProducts === '1';

    const limit  = Math.min(parseInt(req.query.limit || 20), 100);
    const offset = parseInt(req.query.offset || 0);

    const where = {};
    if (q) where[Op.or] = [
      { title:       { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
    ];
    if (typeof isActive !== 'undefined') where.is_active = isActive;

    const include = withProducts ? [{
      model: Product,
      as: 'products',
      through: { attributes: [] },
      attributes: ['id','title','sku','slug','price']
    }] : [];

    const { count, rows } = await Collection.findAndCountAll({
      where,
      include,
      order: [['created_at','DESC']],
      limit, offset,
      distinct: true
    });

    res.json({ data: rows, total: count, limit, offset });
  } catch (e) {
    console.error('collections.list error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении коллекций' });
  }
};

// GET one
exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Collection.findByPk(id, {
      include: [{
        model: Product,
        as: 'products',
        through: { attributes: [] },
        attributes: ['id','title','sku','slug','price']
      }]
    });
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Коллекция не найдена' });
    res.json({ collection: item });
  } catch (e) {
    console.error('collections.getOne error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при получении коллекции' });
  }
};

// CREATE
exports.create = async (req, res) => {
  const t = await Collection.sequelize.transaction();
  try {
    const { title, description, is_active = false, productIds = [] } = req.body || {};
    if (!title || !String(title).trim())       return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Поле "title" обязательно' });
    if (!description || !String(description).trim()) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Поле "description" обязательно' });

    const collection = await Collection.create({
      title: title.trim(),
      description: description.trim(),
      is_active: parseBool(is_active)
    }, { transaction: t });

    if (Array.isArray(productIds) && productIds.length) {
      const rows = productIds.map(pid => ({ collection_id: collection.id, product_id: Number(pid) }));
      await CollectionProduct.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
    }

    await t.commit();
    const created = await Collection.findByPk(collection.id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.status(201).json({ collection: created });
  } catch (e) {
    await t.rollback();
    console.error('collections.create error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при создании коллекции' });
  }
};

// UPDATE
exports.update = async (req, res) => {
  const t = await Collection.sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const collection = await Collection.findByPk(id);
    if (!collection) return res.status(404).json({ code: 'NOT_FOUND', message: 'Коллекция не найдена' });

    const { title, description, is_active, productIds } = req.body || {};
    if (typeof title !== 'undefined') {
      if (!String(title).trim()) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Поле "title" не может быть пустым' });
      collection.title = title.trim();
    }
    if (typeof description !== 'undefined') {
      if (!String(description).trim()) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Поле "description" не может быть пустым' });
      collection.description = description.trim();
    }
    if (typeof is_active !== 'undefined') collection.is_active = parseBool(is_active);

    await collection.save({ transaction: t });

    if (Array.isArray(productIds)) {
      // Полная переустановка состава
      await CollectionProduct.destroy({ where: { collection_id: id }, transaction: t });
      if (productIds.length) {
        const rows = productIds.map(pid => ({ collection_id: id, product_id: Number(pid) }));
        await CollectionProduct.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
      }
    }

    await t.commit();
    const updated = await Collection.findByPk(id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.json({ collection: updated });
  } catch (e) {
    await t.rollback();
    console.error('collections.update error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при обновлении коллекции' });
  }
};

// DELETE
exports.remove = async (req, res) => {
  const t = await Collection.sequelize.transaction();
  try {
    const id = Number(req.params.id);
    const n = await Collection.destroy({ where: { id }, transaction: t });
    await CollectionProduct.destroy({ where: { collection_id: id }, transaction: t });
    await t.commit();

    if (!n) return res.status(404).json({ code: 'NOT_FOUND', message: 'Коллекция не найдена' });
    res.status(204).send();
  } catch (e) {
    await t.rollback();
    console.error('collections.remove error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении коллекции' });
  }
};

// Добавить товары в коллекцию
exports.addProducts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { productIds = [] } = req.body || {};
    if (!Array.isArray(productIds) || !productIds.length) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Нужен массив productIds' });
    }
    const rows = productIds.map(pid => ({ collection_id: id, product_id: Number(pid) }));
    await CollectionProduct.bulkCreate(rows, { ignoreDuplicates: true });

    const updated = await Collection.findByPk(id, {
      include: [{ model: Product, as: 'products', through: { attributes: [] }, attributes: ['id','title','sku','slug','price'] }]
    });
    res.json({ collection: updated });
  } catch (e) {
    console.error('collections.addProducts error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при добавлении товаров в коллекцию' });
  }
};

// Удалить товары из коллекции
exports.removeProducts = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { productIds = [] } = req.body || {};
    if (!Array.isArray(productIds) || !productIds.length) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Нужен массив productIds' });
    }
    const n = await CollectionProduct.destroy({
      where: { collection_id: id, product_id: { [Op.in]: productIds.map(Number) } }
    });
    res.json({ removed: n });
  } catch (e) {
    console.error('collections.removeProducts error:', e);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка при удалении товаров из коллекции' });
  }
};
