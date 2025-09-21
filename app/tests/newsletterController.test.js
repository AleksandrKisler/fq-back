process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

const test = require('node:test');
const assert = require('assert');

const models = require('../models');
const newsletterController = require('../controllers/newsletterController');
const emailService = require('../utils/emailService');

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
    }
  };
}

test('sendNewsletter sends messages to confirmed users', async () => {
  const originalFindAll = models.User.findAll;
  const originalSendEmail = emailService.sendEmail;

  let receivedQuery;
  models.User.findAll = async (query) => {
    receivedQuery = query;
    return [
      {
        get(field) {
          if (field === 'email') {
            return 'user1@example.com';
          }
          return undefined;
        }
      },
      {email: 'user2@example.com'}
    ];
  };

  const sentPayloads = [];
  emailService.sendEmail = async (payload) => {
    sentPayloads.push(payload);
  };

  const req = {
    body: {
      subject: 'Promo',
      template: '<p>Special offer</p>',
      criteria: {where: {is_admin: false}, limit: 50}
    }
  };
  const res = createMockRes();

  try {
    await newsletterController.sendNewsletter(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(receivedQuery, {
      where: {is_admin: false, isConfirmed: true},
      limit: 50
    });
    assert.strictEqual(sentPayloads.length, 2);
    assert.ok(sentPayloads.every((payload) => payload.subject === 'Promo'));
    assert.strictEqual(res.jsonPayload.summary.total, 2);
    assert.strictEqual(res.jsonPayload.summary.sent, 2);
    assert.strictEqual(res.jsonPayload.summary.failed, 0);
    assert.deepStrictEqual(res.jsonPayload.failures, []);
  } finally {
    models.User.findAll = originalFindAll;
    emailService.sendEmail = originalSendEmail;
  }
});

test('sendNewsletter reports individual delivery failures', async () => {
  const originalFindAll = models.User.findAll;
  const originalSendEmail = emailService.sendEmail;

  models.User.findAll = async () => [
    {email: 'success@example.com'},
    {email: 'fail@example.com'}
  ];

  let call = 0;
  emailService.sendEmail = async ({to}) => {
    call += 1;
    if (to === 'fail@example.com') {
      throw new Error('SMTP error');
    }
  };

  const req = {
    body: {
      subject: 'Promo',
      template: '<p>Special offer</p>'
    }
  };
  const res = createMockRes();

  try {
    await newsletterController.sendNewsletter(req, res);

    assert.strictEqual(call, 2);
    assert.strictEqual(res.statusCode, 207);
    assert.strictEqual(res.jsonPayload.summary.total, 2);
    assert.strictEqual(res.jsonPayload.summary.sent, 1);
    assert.strictEqual(res.jsonPayload.summary.failed, 1);
    assert.strictEqual(res.jsonPayload.failures.length, 1);
    assert.strictEqual(res.jsonPayload.failures[0].email, 'fail@example.com');
    assert.match(res.jsonPayload.failures[0].reason, /SMTP error/);
  } finally {
    models.User.findAll = originalFindAll;
    emailService.sendEmail = originalSendEmail;
  }
});
