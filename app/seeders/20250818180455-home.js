'use strict';

async function resetIdentity(db, table, column = 'id') {
  await db.query(`
    DO $$
    DECLARE seq regclass;
    BEGIN
      SELECT pg_get_serial_sequence('${table}', '${column}') INTO seq;
      IF seq IS NOT NULL THEN
        PERFORM setval(
          seq,
          COALESCE((SELECT MAX(${column}) FROM ${table}), 0) + 1,
          false
        );
      END IF;
    END$$;
  `);
}
module.exports = {
  async up (qi) {
    const sql = qi.sequelize;
    const now = new Date();

    // ---------- 0) Подготовка: соберём N id товаров ----------
    const take = 60;
    const [prodRows] = await sql.query(
      `SELECT id FROM products ORDER BY id ASC LIMIT ${take};`
    );
    const productIds = prodRows.map(r => r.id);
    if (productIds.length === 0) {
      console.warn('[seed:home-demo] В БД нет products — связи с товарами будут пропущены.');
    }

    // Утилита: распределить массив по чанкам примерно поровну
    function takeChunk(ids, n) { return ids.splice(0, Math.min(n, ids.length)); }

    // ---------- 1) Коллекции ----------
    const collections = [
      { title: 'Новинки недели', description: 'Свежие модели текущего сезона.', is_active: true,  created_at: now, updated_at: now },
      { title: 'Летняя распродажа', description: 'Скидки до 30% на избранные позиции.', is_active: true, created_at: now, updated_at: now },
      { title: 'Спортивный стиль', description: 'Кроссовки и кеды для города и спорта.', is_active: true, created_at: now, updated_at: now },
    ];


    await qi.bulkDelete('collections', { title: collections.map(c => c.title) });
    await resetIdentity(qi.sequelize, 'collections');
    await qi.bulkInsert('collections', collections);

    const [colRows] = await sql.query(
      `SELECT id, title FROM collections WHERE title = ANY($1)`,
      { bind: [collections.map(c => c.title)] }
    );
    const colByTitle = Object.fromEntries(colRows.map(r => [r.title, r.id]));

    // связи коллекций с товарами (если есть продукты)
    if (productIds.length) {
      const left = productIds.slice(); // копия
      const cp = [];
      cp.push(...takeChunk(left, 15).map(pid => ({ collection_id: colByTitle['Новинки недели'],     product_id: pid })));
      cp.push(...takeChunk(left, 15).map(pid => ({ collection_id: colByTitle['Летняя распродажа'],   product_id: pid })));
      cp.push(...takeChunk(left, 15).map(pid => ({ collection_id: colByTitle['Спортивный стиль'],    product_id: pid })));
      await qi.bulkDelete('collection_products', { collection_id: Object.values(colByTitle) });
      if (cp.length) await qi.bulkInsert('collection_products', cp);
    }

    // ---------- 2) Подборки (selections) ----------
    const selections = [
      { title: 'Топ кроссовки',  slug: 'top-sneakers',  description: 'Лучшие кроссовки недели.',     is_active: true },
      { title: 'Хиты продаж',    slug: 'best-sellers',  description: 'Модели-бестселлеры магазина.',  is_active: true },
      { title: 'Туфли на каждый день', slug: 'daily-heels', description: 'Удобные модели на каждый день.', is_active: true },
    ];

    // чистим по slug и создаём
    await qi.bulkDelete('selections', { slug: selections.map(s => s.slug) });
    await qi.bulkInsert('selections', selections.map(s => ({
      ...s,
      created_at: now, updated_at: now
    })));

    const [selRows] = await sql.query(
      `SELECT id, slug FROM selections WHERE slug = ANY($1)`,
      { bind: [selections.map(s => s.slug)] }
    );
    const selBySlug = Object.fromEntries(selRows.map(r => [r.slug, r.id]));

    // связи selection_products
    if (productIds.length) {
      const left = productIds.slice(); // копия
      const sp = [];
      sp.push(...takeChunk(left, 12).map(pid => ({ collection_id: selBySlug['top-sneakers'], product_id: pid })));
      sp.push(...takeChunk(left, 12).map(pid => ({ collection_id: selBySlug['best-sellers'], product_id: pid })));
      sp.push(...takeChunk(left, 12).map(pid => ({ collection_id: selBySlug['daily-heels'],  product_id: pid })));

      await qi.bulkDelete('selection_products', { collection_id: Object.values(selBySlug) });
      if (sp.length) await qi.bulkInsert('selection_products', sp);
    }

    // ---------- 3) Баннеры ----------
    const banners = [
      {
        type: 'INFORMATION',
        title: 'Главный баннер: Осень/Зима',
        description: 'Новая коллекция AW·25 — тепло и стиль.',
        source: null,
        image_position: 'RIGHT',
        image_url: '/banners/aw25-hero.jpg',
        is_active: true, created_at: now, updated_at: now
      },
      {
        type: 'COLLECTION',
        title: 'Подборка: Топ кроссовки',
        description: 'Выбор редакции: лучшие пары недели.',
        source: 'selection:top-sneakers',
        image_position: 'LEFT',
        image_url: '/banners/sneakers-pick.jpg',
        is_active: true, created_at: now, updated_at: now
      },
      {
        type: 'COLLECTION',
        title: 'Подборка: Хиты продаж',
        description: 'Проверенные временем модели.',
        source: 'selection:best-sellers',
        image_position: 'DEFAULT',
        image_url: '/banners/best-sellers.jpg',
        is_active: true, created_at: now, updated_at: now
      },
      {
        type: 'COLLECTION',
        title: 'Подборка: На каждый день',
        description: 'Комфортная классика.',
        source: 'selection:daily-heels',
        image_position: 'LEFT',
        image_url: '/banners/daily-heels.jpg',
        is_active: true, created_at: now, updated_at: now
      }
    ];
    // чистим по title и создаём
    await qi.bulkDelete('banners', { title: banners.map(b => b.title) });
    await qi.bulkInsert('banners', banners);

    const [banRows] = await sql.query(
      `SELECT id, title FROM banners WHERE title = ANY($1)`,
      { bind: [banners.map(b => b.title)] }
    );
    const banByTitle = Object.fromEntries(banRows.map(r => [r.title, r.id]));

    // ---------- 4) Главная страница (одна активная) ----------
    // деактивируем текущие активные, чтобы не упасть на unique-partial индексе
    await sql.query(`UPDATE home_pages SET is_active = false WHERE is_active = true;`);

    // удалим нашу, если есть
    await qi.bulkDelete('home_pages', { slug: 'home-default' }, {});

    // создаём страницу
    const [createdPageRows] = await sql.query(
      `INSERT INTO home_pages (title, slug, is_active, published_at, created_at, updated_at)
       VALUES ('Главная по умолчанию', 'home-default', true, NOW(), NOW(), NOW())
       RETURNING id;`
    );
    const pageId = createdPageRows[0].id;

    // заполним слоты баннеров
    const bannerSlots = [
      { slot: 'main',   banner_id: banByTitle['Главный баннер: Осень/Зима'] },
      { slot: 'slot-1', banner_id: banByTitle['Подборка: Топ кроссовки']   },
      { slot: 'slot-2', banner_id: banByTitle['Подборка: Хиты продаж']     },
      { slot: 'slot-3', banner_id: banByTitle['Подборка: На каждый день']  },
    ].filter(x => x.banner_id);

    await qi.bulkDelete('home_banner_slots', { page_id: pageId });
    await qi.bulkInsert('home_banner_slots', bannerSlots.map(s => ({
      page_id: pageId, slot: s.slot, banner_id: s.banner_id, created_at: now, updated_at: now
    })));

    // заполним слоты подборок
    const selectionSlots = [
      { slot: 'slot-1', selection_id: selBySlug['top-sneakers'] },
      { slot: 'slot-2', selection_id: selBySlug['best-sellers'] },
      { slot: 'slot-3', selection_id: selBySlug['daily-heels']  },
    ].filter(x => x.selection_id);

    await qi.bulkDelete('home_selection_slots', { page_id: pageId });
    await qi.bulkInsert('home_selection_slots', selectionSlots.map(s => ({
      page_id: pageId, slot: s.slot, selection_id: s.selection_id, created_at: now, updated_at: now
    })));

    console.log(`[seed:home-demo] OK. page_id=${pageId}`);
  },

  async down (qi) {
    const sql = qi.sequelize;

    // убрать нашу домашнюю
    const [rows] = await sql.query(`SELECT id FROM home_pages WHERE slug='home-default' LIMIT 1;`);
    if (rows.length) {
      const id = rows[0].id;
      await qi.bulkDelete('home_banner_slots',   { page_id: id });
      await qi.bulkDelete('home_selection_slots',{ page_id: id });
      await qi.bulkDelete('home_pages', { id });
    }

    // удалить тестовые баннеры
    const banTitles = [
      'Главный баннер: Осень/Зима',
      'Подборка: Топ кроссовки',
      'Подборка: Хиты продаж',
      'Подборка: На каждый день'
    ];
    await qi.bulkDelete('banners', { title: banTitles });

    // удалить тестовые подборки и их связи
    const selSlugs = ['top-sneakers','best-sellers','daily-heels'];
    const [selRows] = await sql.query(`SELECT id FROM selections WHERE slug = ANY($1)`, { bind: [selSlugs] });
    if (selRows.length) {
      await qi.bulkDelete('selection_products', { collection_id: selRows.map(r => r.id) });
      await qi.bulkDelete('selections', { id: selRows.map(r => r.id) });
    }

    // удалить тестовые коллекции и их связи
    const colTitles = ['Новинки недели','Летняя распродажа','Спортивный стиль'];
    const [colRows] = await sql.query(`SELECT id FROM collections WHERE title = ANY($1)`, { bind: [colTitles] });
    if (colRows.length) {
      await qi.bulkDelete('collection_products', { collection_id: colRows.map(r => r.id) });
      await qi.bulkDelete('collections', { id: colRows.map(r => r.id) });
    }
  }
};
