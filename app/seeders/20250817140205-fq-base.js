'use strict';

// 30 карточек: по 6 из каждой категории
const CATALOG = [
  // /tufli/
  {
    slug: 'tufli-zhenskie-iz-naturalnoj-lakirovannoj-kozhi-na-ustojchivom-kabluke-679907',
    id: 679907,
    cat: 'tufli',
    title: 'Туфли женские из натуральной лакированной кожи на устойчивом каблуке'
  },
  {
    slug: 'tufli-iz-naturalnoj-chernoj-kozhi-na-platforme-313135',
    id: 313135,
    cat: 'tufli',
    title: 'Туфли из натуральной черной кожи на платформе'
  },
  {
    slug: 'tufli-v-naturalnoj-kozhe-belogo-czveta-s-perepletayushhimisya-remeshkami-679373',
    id: 679373,
    cat: 'tufli',
    title: 'Туфли в натуральной коже белого цвета с переплетающимися ремешками'
  },
  {
    slug: 'tufli-iz-chernoj-zamshi-s-vyirezom-119754',
    id: 119754,
    cat: 'tufli',
    title: 'Туфли из черной замши с вырезом'
  },
  {
    slug: 'tufli-zhenskie-iz-naturalnoj-lakirovannoj-kozhi-krasnogo-czveta-s-perepletayushhimsya-remeshkom-680021',
    id: 680021,
    cat: 'tufli',
    title: 'Туфли красный лак с переплетающимся ремешком'
  },
  {
    slug: 'tufli-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-na-shnurovke-680093',
    id: 680093,
    cat: 'tufli',
    title: 'Туфли из натуральной черной кожи на шнуровке'
  },

  // /bosonozhki/
  {
    slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-leopardovoj-podoshvoj-680106',
    id: 680106,
    cat: 'bosonozhki',
    title: 'Босоножки черная кожа с леопардовой подошвой'
  },
  {
    slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-krasnyim-serdczem-679995',
    id: 679995,
    cat: 'bosonozhki',
    title: 'Босоножки черная кожа с красным сердцем'
  },
  {
    slug: 'bosonozhki-iz-naturalnoj-kozhi-v-sinem-czvete-679302',
    id: 679302,
    cat: 'bosonozhki',
    title: 'Босоножки в синем цвете'
  },
  {
    slug: 'bosonozhki-v-naturalnoj-kozhe-chernogo-czveta-na-tolstom-kabluke-679376',
    id: 679376,
    cat: 'bosonozhki',
    title: 'Босоножки черная кожа на толстом каблуке'
  },
  {
    slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-otkryitoj-pyatkoj-i-leo-podoshvoj-680122',
    id: 680122,
    cat: 'bosonozhki',
    title: 'Босоножки с открытой пяткой и лео-подошвой'
  },
  {
    slug: 'bosonozhki-iz-naturalnoj-lakirovannoj-kozhi-v-czvet-pudryi-na-nizkom-kabluke-679997',
    id: 679997,
    cat: 'bosonozhki',
    title: 'Босоножки лак пудра на низком каблуке'
  },

  // /botilonyi/
  {
    slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-s-otkryityim-vyirezom-na-shpilke-679499',
    id: 679499,
    cat: 'botilonyi',
    title: 'Ботильоны черная кожа с вырезом на шпильке'
  },
  {
    slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-so-shhnurovkoj-na-vyisokom-kabluke-679556',
    id: 679556,
    cat: 'botilonyi',
    title: 'Ботильоны черная кожа со шнуровкой'
  },
  {
    slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-v-molochnom-czvete-na-tonkoj-shpilke-679909',
    id: 679909,
    cat: 'botilonyi',
    title: 'Ботильоны молочный цвет на шпильке'
  },
  {
    slug: 'botilonyi-iz-naturalnoj-kozhi-chernogo-czveta-680170',
    id: 680170,
    cat: 'botilonyi',
    title: 'Ботильоны из натуральной кожи черного цвета'
  },
  {
    slug: 'botilonyi-bezhevogo-czveta-iz-naturalnoj-kozhi-na-molnii-288139',
    id: 288139,
    cat: 'botilonyi',
    title: 'Ботильоны бежевые из кожи на молнии'
  },
  {
    slug: 'botilonyi-zhenskie-iz-naturalnogo-vorsa-poni-v-leopardovom-okrase-na-vyisokoj-shpilke-679559',
    id: 679559,
    cat: 'botilonyi',
    title: 'Ботильоны ворс пони леопард'
  },

  // /sapogi/
  {
    slug: 'sapogi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-na-nevisokoj-shpilke-679571',
    id: 679571,
    cat: 'sapogi',
    title: 'Сапоги черная кожа на невысокой шпильке'
  },
  {
    slug: 'sapogi-zhenskie-v-naturalnoj-lakirovannoj-kozhe-serebristogo-czveta-na-nevyisokom-kabluke-679567',
    id: 679567,
    cat: 'sapogi',
    title: 'Сапоги серебристый лак на невысоком каблуке'
  },
  {
    slug: 'sapogi-zhenskie-iz-naturalnoj-kozhi-s-tisneniem-pod-krokodila-kofejnogo-czveta-na-ustojchivom-kabluke-679523',
    id: 679523,
    cat: 'sapogi',
    title: 'Сапоги кофе с тиснением под кроко'
  },
  {
    slug: 'sapogi-zhenskie-v-cherno-belom-czvete-iz-naturalnoj-kozhi-v-ustojchivom-kabluke-679566',
    id: 679566,
    cat: 'sapogi',
    title: 'Сапоги чёрно-белые на устойчивом каблуке'
  },
  {slug: 'sapogi-truby-molochnye-kozhanye-2116', id: 2116, cat: 'sapogi', title: 'Сапоги-трубы молочные кожаные'},
  {
    slug: 'sapogi-kozhanye-s-kaemkoy-na-tolstom-kabluke-2416',
    id: 2416,
    cat: 'sapogi',
    title: 'Сапоги кожаные с каймой на толстом каблуке'
  },

  // /krossovki-i-kedyi/
  {
    slug: 'kedyi-iz-naturalnoj-kozhi-v-belom-czvete-679424',
    id: 679424,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды из натуральной кожи белые'
  },
  {
    slug: 'kedyi-iz-naturalnoj-kozhi-v-serebristom-czvete-679426',
    id: 679426,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды из натуральной кожи серебристые'
  },
  {
    slug: 'kedyi-iz-naturalnoj-kozhi-belogo-czveta-na-platforme-679425',
    id: 679425,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды белые на платформе'
  },
  {
    slug: 'kedyi-belogo-czveta-v-naturalnoj-kozhe-s-chernoj-vstavkoj-679419',
    id: 679419,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды белые с черной вставкой'
  },
  {
    slug: 'kedyi-v-naturalnoj-kozhe-belogo-czveta-s-zerkalnoj-vstavkoj-679421',
    id: 679421,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды белые с зеркальной вставкой'
  },
  {
    slug: 'kedyi-v-naturalnoj-kozhe-kremovogo-czveta-s-zamshevoj-vstavkoj-679422',
    id: 679422,
    cat: 'krossovki-i-kedyi',
    title: 'Кеды кремовые с замшевой вставкой'
  },
];

const PRICE_BY_CAT = {
  'tufli': [19990, 34990],
  'bosonozhki': [14990, 29990],
  'botilonyi': [24990, 39990],
  'sapogi': [24990, 49990],
  'krossovki-i-kedyi': [17990, 29990],
};

function money(min, max) {
  return Number((min + (max - min) * rand()).toFixed(2));
}

const ATTR_COLOR_VALUES = [101, 102, 103, 104]; // чёрный/бежевый/белый/бордо
const ATTR_SIZE_VALUES = [200, 201, 202, 203, 204, 205, 206]; // 35..41
const CAT_CODE = {'tufli': 'TUF', 'bosonozhki': 'BOS', 'botilonyi': 'BOT', 'sapogi': 'SAP', 'krossovki-i-kedyi': 'KED'};

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = arr => arr[Math.floor(rand() * arr.length)];

module.exports = {
  // --- В САМЫЙ ВЕРХ up() ---
  async up(qi) {
    const t = await qi.sequelize.transaction();
    try {
      // 0) sequences: чтобы INSERT не пытался снова выдать id=1 в categories
      await qi.sequelize.query(`
        SELECT setval(pg_get_serial_sequence('categories', 'id'),
                      COALESCE((SELECT MAX(id) FROM categories), 0))
      `, {transaction: t});

      // 1) Родитель "Обувь" (slug obuv) — без удаления (безопасно для FK)
      const [[parentRow]] = await qi.sequelize.query(
        `INSERT INTO categories (title, slug, parent_id)
         VALUES ('Обувь', 'obuv', NULL) ON CONFLICT (slug) DO
        UPDATE SET title = EXCLUDED.title
          RETURNING id`,
        {transaction: t}
      );
      const parentId = parentRow?.id;

      // 2) Приводим к единому slug для кроссовок: krossovki-kedy → krossovki-i-kedyi
      await qi.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM categories WHERE slug='krossovki-kedy')
           AND NOT EXISTS (SELECT 1 FROM categories WHERE slug='krossovki-i-kedyi') THEN
          UPDATE categories
             SET slug='krossovki-i-kedyi', title='Кроссовки и кеды'
           WHERE slug='krossovki-kedy';
        END IF;
      END$$;
    `, {transaction: t});

      // 3) Гарантируем наличие нужных подкатегорий и ставим parent_id=Обувь
      const cats = [
        {slug: 'tufli', title: 'Туфли'},
        {slug: 'bosonozhki', title: 'Босоножки'},
        {slug: 'botilonyi', title: 'Ботильоны'},
        {slug: 'sapogi', title: 'Сапоги'},
        {slug: 'krossovki-i-kedyi', title: 'Кроссовки и кеды'}
      ];
      for (const c of cats) {
        // UPDATE (если есть), иначе INSERT
        const [res] = await qi.sequelize.query(
          `UPDATE categories
           SET title=$1,
               parent_id=$3
           WHERE slug = $2 RETURNING id`,
          {bind: [c.title, c.slug, parentId], transaction: t}
        );
        if (!res.length) {
          await qi.sequelize.query(
            `INSERT INTO categories (title, slug, parent_id)
             VALUES ($1, $2, $3)`,
            {bind: [c.title, c.slug, parentId], transaction: t}
          );
        }
      }

      // Получаем id категорий по slug
      const [rows] = await qi.sequelize.query(
        `SELECT id, slug
         FROM categories
         WHERE slug IN ('tufli', 'bosonozhki', 'botilonyi', 'sapogi', 'krossovki-i-kedyi')`,
        {transaction: t}
      );
      const catIdBySlug = new Map(rows.map(r => [r.slug, r.id]));

      // 4) "Перетираем" только НАШУ выборку товаров: удаляем по slug → вставляем заново
      const ourSlugs = CATALOG.map(p => p.slug);
      // variation_attributes → product_variations → product_images → products
      await qi.sequelize.query(`
        DELETE
        FROM variation_attributes
        WHERE variation_id IN (SELECT id
                               FROM product_variations
                               WHERE product_id IN (SELECT id FROM products WHERE slug = ANY ($1)))
      `, {bind: [ourSlugs], transaction: t});

      await qi.sequelize.query(`
        DELETE
        FROM product_variations
        WHERE product_id IN (SELECT id FROM products WHERE slug = ANY ($1))
      `, {bind: [ourSlugs], transaction: t});

      // В зависимости от регистра вашей таблицы связей:
      // если snake_case:
      const [reg] = await qi.sequelize.query(
        `SELECT
     to_regclass('public."ProductImages"') AS pi,
     to_regclass('public.product_images')  AS pis`,
        {transaction: t}
      );

      if (reg[0].pi) {
        // Таблица с CamelCase и кавычками
        await qi.sequelize.query(
          `DELETE
           FROM "ProductImages" AS pi USING products p
           WHERE pi.product_id = p.id
             AND p.slug = ANY ($1)`,
          {bind: [ourSlugs], transaction: t}
        );
      } else if (reg[0].pis) {
        // Таблица в snake_case
        await qi.sequelize.query(
          `DELETE
           FROM product_images AS pi USING products p
           WHERE pi.product_id = p.id
             AND p.slug = ANY ($1)`,
          {bind: [ourSlugs], transaction: t}
        );
      }

      await qi.sequelize.query(`
        DELETE
        FROM products
        WHERE slug = ANY ($1)
      `, {bind: [ourSlugs], transaction: t});

      // 5) Сборка и вставка products заново (с уже известными category_id)
      const CAT_CODE = {
        'tufli': 'TUF',
        'bosonozhki': 'BOS',
        'botilonyi': 'BOT',
        'sapogi': 'SAP',
        'krossovki-i-kedyi': 'KED'
      };
      const products = CATALOG.map(p => {
        const [min, max] = PRICE_BY_CAT[p.cat] || [19990, 34990];
        const price = money(min, max);
        return {
          id: p.id,
          sku: `FQ-${CAT_CODE[p.cat]}-${p.id}`,
          title: p.title,
          category_id: catIdBySlug.get(p.cat),
          description: `${p.title}. Категория: ${p.cat}.`,
          slug: p.slug,
          price: price,
        }
      });

      // 6) Вариации/атрибуты (как у вас было раньше)
      function mulberry32(seed) {
        return function () {
          let t = seed += 0x6D2B79F5;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }

      const rand = mulberry32(42);
      const pick = arr => arr[Math.floor(rand() * arr.length)];

// значения атрибутов (под твой справочник)
      const ATTR_COLOR_VALUES = [101, 102, 103, 104];            // Чёрный, Бежевый, Белый, Бордо
      const ATTR_SIZE_VALUES = [200, 201, 202, 203, 204, 205, 206]; // 35..41

      const variations = [];
      const varAttrs = [];

      for (const p of CATALOG) {
        for (let i = 1; i <= 2; i++) {
          const vid = p.id * 10 + i;                 // детерминированный id вариации
          const qty = Math.floor(rand() * 18) + 3;   // 3..20
          const vsku = `FQ-${CAT_CODE[p.cat]}-${p.id}-V${i}`;

          // сама вариация (цены в вариации нет — как ты и просил)
          variations.push({
            id: vid,
            product_id: p.id,
            sku: vsku,
            stock_quantity: qty
          });

          // атрибуты вариации: 1 цвет (случайный) + все размеры 35..41
          varAttrs.push({variation_id: vid, value_id: pick(ATTR_COLOR_VALUES)});
          for (const sizeVal of ATTR_SIZE_VALUES) {
            varAttrs.push({variation_id: vid, value_id: sizeVal});
          }
        }
      }

      await qi.bulkInsert('products', products, {transaction: t});
      await qi.bulkInsert('product_variations', variations, {transaction: t});

      const chunk = 2000;
      for (let i = 0; i < varAttrs.length; i += chunk) {
        // eslint-disable-next-line no-await-in-loop
        await qi.bulkInsert('variation_attributes', varAttrs.slice(i, i + chunk), {transaction: t});
      }

      // 7) sequences после наших вставок — чтобы будущие auto id не падали
      await qi.sequelize.query(`
        SELECT setval(pg_get_serial_sequence('products', 'id'),
                      COALESCE((SELECT MAX(id) FROM products), 0))
      `, {transaction: t});
      await qi.sequelize.query(`
        SELECT setval(pg_get_serial_sequence('product_variations', 'id'),
                      COALESCE((SELECT MAX(id) FROM product_variations), 0))
      `, {transaction: t});

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(qi) {
    // удаляем всё, что добавили
    const prodIds = CATALOG.map(p => p.id);
    // variation ids
    const varIds = [];
    for (const p of CATALOG) {
      for (let i = 1; i <= 2; i++) varIds.push(p.id * 10 + i);
    }

    await qi.bulkDelete('variation_attributes', {variation_id: varIds});
    await qi.bulkDelete('product_variations', {id: varIds});
    await qi.bulkDelete('products', {id: prodIds});
    // категории не трогаем (могут использоваться другими товарами)
  }
};
