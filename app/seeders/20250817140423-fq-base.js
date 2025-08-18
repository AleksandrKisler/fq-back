'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up (qi) {
    const manifestPath = path.resolve('./seeders/_data/fq-images.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found at ${manifestPath}. Сначала запусти scripts/fq_fetch_images_selected.mjs`);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    const slugs = Object.keys(manifest);
    if (!slugs.length) return;

    // получаем id продукта по slug
    const [prods] = await qi.sequelize.query(
      `SELECT id, slug FROM products WHERE slug IN (${slugs.map((_,i)=>'$'+(i+1)).join(',')})`,
      { bind: slugs }
    );
    const idBySlug = new Map(prods.map(p=>[p.slug,p.id]));
    console.log(`idBySlug: ${idBySlug.size}`);
    // вставляем Images
    const images = [];
    const now = new Date();
    for (const slug of slugs){
      console.log('manifest[slug], slug', manifest[slug], slug)
      for (const it of (manifest[slug]||[])){
        const disk = path.resolve(`.${it.file_path}`); // '/app/...' → './app/...'
        if (fs.existsSync(disk)) {
          images.push({
            file_path: it.file_path, // таблица Images (CamelCase) — как в ваших моделях
            file_url:  it.file_url,
            file_size: it.file_size || null,
            created_at: now
          });
        }
      }
    }
    console.log('images.length', images.length);
    if (!images.length) return;
    await qi.bulkInsert('images', images);

    // читаем id картинок по file_path
    const [imgRows] = await qi.sequelize.query(
      `SELECT id, file_path FROM "images" WHERE file_path LIKE '/public/product/images/%'`
    );
    const imgIdByPath = new Map(imgRows.map(r=>[r.file_path, r.id]));

    // вставляем связи ProductImages
    const pivots = [];
    for (const slug of slugs){
      const pid = idBySlug.get(slug);
      if (!pid) continue;
      const items = (manifest[slug] || []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
      items.forEach(it=>{
        const iid = imgIdByPath.get(it.file_path);
        if (iid) pivots.push({ product_id: pid, image_id: iid, sort_order: it.sort_order ?? 0, created_at: now });
      });
    }
    if (pivots.length) await qi.bulkInsert('product_images', pivots);
  },

  async down (qi) {
    const [imgRows] = await qi.sequelize.query(
      `SELECT id FROM "images" WHERE file_path LIKE '/app/public/product/images/%'`
    );
    const ids = imgRows.map(r=>r.id);
    if (ids.length){
      await qi.bulkDelete('product_images', { image_id: ids });
      await qi.bulkDelete('images', { id: ids });
    }
  }
};
