#!/usr/bin/env node
// ESM-скрипт: для заданного каталога (те же 30 slug) скачивает 2–5 изображений
// в /app/public/product/images/<slug>/img-XX.ext
// и сохраняет манифест для сида: app/seeders/_data/fq-images.json

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SITE = 'https://foreverqueen.ru';
const OUT_DIR = path.resolve('./public/product/images');
const MANIFEST = path.resolve('./seeders/_data/fq-images.json');
const MAX_PER_PRODUCT = 8;

const CATALOG = [
  // те же элементы, что в сидере (cat + slug)
  {cat: 'tufli', slug: 'tufli-zhenskie-iz-naturalnoj-lakirovannoj-kozhi-na-ustojchivom-kabluke-679907'},
  {cat: 'tufli', slug: 'tufli-iz-naturalnoj-chernoj-kozhi-na-platforme-313135'},
  {cat: 'tufli', slug: 'tufli-v-naturalnoj-kozhe-belogo-czveta-s-perepletayushhimisya-remeshkami-679373'},
  {cat: 'tufli', slug: 'tufli-iz-chernoj-zamshi-s-vyirezom-119754'},
  {
    cat: 'tufli',
    slug: 'tufli-zhenskie-iz-naturalnoj-lakirovannoj-kozhi-krasnogo-czveta-s-perepletayushhimsya-remeshkom-680021'
  },
  {cat: 'tufli', slug: 'tufli-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-na-shnurovke-680093'},

  {cat: 'bosonozhki', slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-leopardovoj-podoshvoj-680106'},
  {cat: 'bosonozhki', slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-krasnyim-serdczem-679995'},
  {cat: 'bosonozhki', slug: 'bosonozhki-iz-naturalnoj-kozhi-v-sinem-czvete-679302'},
  {cat: 'bosonozhki', slug: 'bosonozhki-v-naturalnoj-kozhe-chernogo-czveta-na-tolstom-kabluke-679376'},
  {
    cat: 'bosonozhki',
    slug: 'bosonozhki-iz-naturalnoj-kozhi-chernogo-czveta-s-otkryitoj-pyatkoj-i-leo-podoshvoj-680122'
  },
  {cat: 'bosonozhki', slug: 'bosonozhki-iz-naturalnoj-lakirovannoj-kozhi-v-czvet-pudryi-na-nizkom-kabluke-679997'},

  {
    cat: 'botilonyi',
    slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-s-otkryityim-vyirezom-na-shpilke-679499'
  },
  {
    cat: 'botilonyi',
    slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-so-shhnurovkoj-na-vyisokom-kabluke-679556'
  },
  {cat: 'botilonyi', slug: 'botilonyi-zhenskie-iz-naturalnoj-kozhi-v-molochnom-czvete-na-tonkoj-shpilke-679909'},
  {cat: 'botilonyi', slug: 'botilonyi-iz-naturalnoj-kozhi-chernogo-czveta-680170'},
  {cat: 'botilonyi', slug: 'botilonyi-bezhevogo-czveta-iz-naturalnoj-kozhi-na-molnii-288139'},
  {
    cat: 'botilonyi',
    slug: 'botilonyi-zhenskie-iz-naturalnogo-vorsa-poni-v-leopardovom-okrase-na-vyisokoj-shpilke-679559'
  },

  {cat: 'sapogi', slug: 'sapogi-zhenskie-iz-naturalnoj-kozhi-chernogo-czveta-na-nevisokoj-shpilke-679571'},
  {
    cat: 'sapogi',
    slug: 'sapogi-zhenskie-v-naturalnoj-lakirovannoj-kozhe-serebristogo-czveta-na-nevyisokom-kabluke-679567'
  },
  {
    cat: 'sapogi',
    slug: 'sapogi-zhenskie-iz-naturalnoj-kozhi-s-tisneniem-pod-krokodila-kofejnogo-czveta-na-ustojchivom-kabluke-679523'
  },
  {cat: 'sapogi', slug: 'sapogi-zhenskie-v-cherno-belom-czvete-iz-naturalnoj-kozhi-v-ustojchivom-kabluke-679566'},
  {cat: 'sapogi', slug: 'sapogi-truby-molochnye-kozhanye-2116'},
  {cat: 'sapogi', slug: 'sapogi-kozhanye-s-kaemkoy-na-tolstom-kabluke-2416'},

  {cat: 'krossovki-i-kedyi', slug: 'kedyi-iz-naturalnoj-kozhi-v-belom-czvete-679424'},
  {cat: 'krossovki-i-kedyi', slug: 'kedyi-iz-naturalnoj-kozhi-v-serebristom-czvete-679426'},
  {cat: 'krossovki-i-kedyi', slug: 'kedyi-iz-naturalnoj-kozhi-belogo-czveta-na-platforme-679425'},
  {cat: 'krossovki-i-kedyi', slug: 'kedyi-belogo-czveta-v-naturalnoj-kozhe-s-chernoj-vstavkoj-679419'},
  {cat: 'krossovki-i-kedyi', slug: 'kedyi-v-naturalnoj-kozhe-belogo-czveta-s-zerkalnoj-vstavkoj-679421'},
  {cat: 'krossovki-i-kedyi', slug: 'kedyi-v-naturalnoj-kozhe-kremovogo-czveta-s-zamshevoj-vstavkoj-679422'},
];

function urlFor(cat, slug) {
  return `${SITE}/${cat}/${slug}.html`;
}

async function fetchHTML(url) {
  const r = await axios.get(url, {
    timeout: 25000,
    headers: {'User-Agent': 'Mozilla/5.0 (compatible; FQFetcher/1.0)'},
    validateStatus: s => s >= 200 && s < 500,
    maxRedirects: 3
  });
  return {status: r.status, data: r.data};
}

function extractImages(html) {
  const $ = cheerio.load(html);
  const urls = new Set();
  const add = u => {
    if (u && /^https?:\/\//.test(u) && /\.(jpe?g|png|webp)(\?|$)/i.test(u)) urls.add(u);
  };
  add($('meta[property="og:image"]').attr('content'));
  $('img,source').each((_, el) => {
    add($(el).attr('src'));
    const ds = $(el).attr('data-src');
    if (ds) add(ds.split(' ')[0]);
    const ss = $(el).attr('srcset');
    if (ss) add(ss.split(',')[0].trim().split(' ')[0]);
  });
  return Array.from(urls).slice(0, MAX_PER_PRODUCT);
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, {recursive: true});
}

async function main() {
  const manifest = {};
  for (const {cat, slug} of CATALOG) {
    const page = urlFor(cat, slug);
    const {status, data} = await fetchHTML(page);
    if (!(status >= 200 && status < 300) || typeof data !== 'string') {
      console.warn('skip', slug, status);
      continue;
    }
    const imgs = extractImages(data);
    if (!imgs.length) {
      console.warn('no imgs', slug);
      continue;
    }

    let order = 0;
    const destDir = path.join(OUT_DIR, slug);
    await ensureDir(destDir);
    manifest[slug] = [];
    const u = imgs[1]
    const ext = path.extname(new URL(u).pathname) || '.jpg';
    const file = `img-${String(++order).padStart(2, '0')}${ext}`;
    const abs = path.join(destDir, file);
    const res = await axios.get(u, {responseType: 'arraybuffer', timeout: 30000});
    await fs.promises.writeFile(abs, res.data);
    manifest[slug].push({
      file_path: `/public/product/images/${slug}/${file}`,
      file_url: `/product/images/${slug}/${file}`,
      file_size: Buffer.byteLength(res.data),
      sort_order: order - 1
    });
    console.log(slug, '->', manifest[slug].length);
  }

  await ensureDir(path.dirname(MANIFEST));
  await fs.promises.writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log('Manifest:', MANIFEST);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
