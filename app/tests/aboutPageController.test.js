process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

const test = require('node:test');
const assert = require('assert');

const models = require('../models');
const aboutPageController = require('../controllers/aboutPageController');

function createMockRes() {
  return {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    send(payload) {
      this.jsonPayload = payload;
      return this;
    }
  };
}

test('create sanitizes HTML fields and normalizes media references', async () => {
  const originalAboutPage = models.AboutPage;
  let savedPayload;

  models.AboutPage = {
    findOne: async () => null,
    create: async (payload) => {
      savedPayload = payload;
      return {
        id: 10,
        ...payload,
        toJSON() {
          return { id: this.id, ...payload };
        }
      };
    }
  };

  const req = {
    body: {
      title: 'О компании',
      blocks: [
        {
          type: 'statement',
          html: '<p>Мы создаем украшения<script>alert(1)</script><strong>каждый день</strong></p>'
        },
        {
          type: 'collage',
          title: 'Фото мастерской',
          items: [
            {
              image: { url: ' https://cdn.example.com/photo-1.jpg ', alt: '  Кольца  ' },
              captionHtml: '<p>Рабочие моменты<script>bad()</script></p>'
            }
          ]
        },
        {
          type: 'hero',
          title: 'Навстречу красоте',
          descriptionHtml: '<h2>Лучшее<script></script></h2>',
          backgroundImage: ' https://cdn.example.com/hero.jpg ',
          buttons: [
            { label: 'Подробнее ', url: ' /about ' }
          ]
        }
      ]
    }
  };
  const res = createMockRes();

  try {
    await aboutPageController.create(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.ok(savedPayload.slug.startsWith('o-kompanii'));
    const statementBlock = res.jsonPayload.page.blocks[0];
    assert.match(statementBlock.html, /Мы создаем украшения/);
    assert.ok(!statementBlock.html.includes('<script>'));

    const collageBlock = res.jsonPayload.page.blocks[1];
    assert.strictEqual(collageBlock.items[0].image.url, 'https://cdn.example.com/photo-1.jpg');
    assert.strictEqual(collageBlock.items[0].image.alt, 'Кольца');
    assert.ok(!collageBlock.items[0].captionHtml.includes('<script>'));

    const heroBlock = res.jsonPayload.page.blocks[2];
    assert.ok(heroBlock.backgroundImage.url.endsWith('hero.jpg'));
    assert.strictEqual(heroBlock.buttons[0].label, 'Подробнее');
    assert.strictEqual(heroBlock.buttons[0].url, '/about');
  } finally {
    models.AboutPage = originalAboutPage;
  }
});

test('create rejects unknown block types', async () => {
  const originalAboutPage = models.AboutPage;
  models.AboutPage = {
    findOne: async () => {
      throw new Error('should not be called when validation fails');
    }
  };

  const req = {
    body: {
      title: 'О проекте',
      blocks: [
        { type: 'unknown', value: '???' }
      ]
    }
  };
  const res = createMockRes();

  try {
    await aboutPageController.create(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(Array.isArray(res.jsonPayload.errors));
    assert.ok(res.jsonPayload.errors.some((msg) => msg.includes('недопустимый тип')));
  } finally {
    models.AboutPage = originalAboutPage;
  }
});

test('update trims fields and sanitizes nested HTML content', async () => {
  const originalAboutPage = models.AboutPage;
  const storedPage = {
    id: 5,
    title: 'Старая версия',
    slug: 'old',
    blocks: [],
    update: async function update(values) {
      Object.assign(this, values);
      return this;
    },
    toJSON() {
      return { id: this.id, title: this.title, slug: this.slug, blocks: this.blocks };
    }
  };

  models.AboutPage = {
    findByPk: async (id) => (id === 5 ? storedPage : null),
    findOne: async () => null
  };

  const req = {
    params: { id: '5' },
    body: {
      title: '  Актуально  ',
      slug: ' aktualno ',
      blocks: [
        {
          type: 'team',
          title: 'Наша команда',
          members: [
            {
              name: '  Анна  ',
              role: '  Дизайнер  ',
              bioHtml: '<p>Создает коллекции<script>alert(1)</script></p>',
              photo: { url: ' https://cdn.example.com/team.jpg ' }
            }
          ]
        }
      ]
    }
  };
  const res = createMockRes();

  try {
    await aboutPageController.update(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(storedPage.title, 'Актуально');
    assert.strictEqual(storedPage.slug, 'aktualno');
    assert.strictEqual(storedPage.blocks[0].members[0].name, 'Анна');
    assert.ok(!storedPage.blocks[0].members[0].bioHtml.includes('<script>'));
    assert.strictEqual(storedPage.blocks[0].members[0].photo.url, 'https://cdn.example.com/team.jpg');
  } finally {
    models.AboutPage = originalAboutPage;
  }
});

test('publish toggles active state for a single page', async () => {
  const originalAboutPage = models.AboutPage;
  const originalSequelize = models.sequelize;
  const page = {
    id: 7,
    is_active: false,
    published_at: null,
    update: async function update(values) {
      Object.assign(this, values);
      return this;
    },
    reload: async function reload() {
      return this;
    },
    toJSON() {
      return { id: this.id, is_active: this.is_active, published_at: this.published_at };
    }
  };
  let deactivatePayload;

  models.AboutPage = {
    findByPk: async (id) => (id === 7 ? page : null),
    update: async (values, options) => {
      deactivatePayload = { values, options };
      return [1];
    }
  };
  models.sequelize = {
    transaction: async (handler) => {
      const fakeTransaction = { name: 'trx' };
      return handler(fakeTransaction);
    }
  };

  const req = { params: { id: '7' }, body: { publish: true } };
  const res = createMockRes();

  try {
    await aboutPageController.publish(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(deactivatePayload.values);
    assert.strictEqual(deactivatePayload.values.is_active, false);
    assert.strictEqual(page.is_active, true);
    assert.ok(page.published_at instanceof Date);
  } finally {
    models.AboutPage = originalAboutPage;
    models.sequelize = originalSequelize;
  }
});

test('getActive returns stored about page', async () => {
  const originalAboutPage = models.AboutPage;
  const activePage = {
    toJSON() {
      return {
        id: 2,
        title: 'About us',
        slug: 'about-us',
        blocks: [
          { type: 'statement', html: '<p>History</p>' },
          { type: 'gallery', images: [{ url: 'https://cdn/img.jpg' }] }
        ]
      };
    }
  };

  models.AboutPage = {
    findOne: async (query) => {
      if (query.where && query.where.is_active) {
        return activePage;
      }
      return null;
    }
  };

  const res = createMockRes();

  try {
    await aboutPageController.getActive({}, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.jsonPayload.page.blocks[0].type, 'statement');
    assert.strictEqual(res.jsonPayload.page.slug, 'about-us');
  } finally {
    models.AboutPage = originalAboutPage;
  }
});
