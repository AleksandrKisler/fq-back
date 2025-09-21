process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

const test = require('node:test');
const assert = require('assert');

const models = require('../models');
const authController = require('../controllers/authController');
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

test('register generates verification token and sends email', async () => {
  const originalFindOne = models.User.findOne;
  const originalCreate = models.User.create;
  const originalSendVerificationEmail = emailService.sendVerificationEmail;

  models.User.findOne = async () => null;

  let createdPayload;
  const createdUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    is_admin: false,
    is_anonymous: false,
    isConfirmed: false,
    emailVerificationToken: null,
    emailVerificationTokenExpires: null,
    get(arg) {
      if (typeof arg === 'string') {
        return this[arg];
      }
      if (arg && arg.plain) {
        return {...this};
      }
      return {...this};
    }
  };

  models.User.create = async (payload) => {
    createdPayload = payload;
    Object.assign(createdUser, payload);
    return createdUser;
  };

  let emailSent;
  emailService.sendVerificationEmail = async (data) => {
    emailSent = data;
  };

  const req = {body: {name: 'John Doe', email: 'john@example.com', password: 'password123'}};
  const res = createMockRes();

  try {
    await authController.register(req, res);

    assert.strictEqual(res.statusCode, 200, 'Should respond with HTTP 200');
    assert.ok(createdPayload.emailVerificationToken, 'Verification token should be generated');
    assert.ok(createdPayload.emailVerificationTokenExpires instanceof Date, 'Expiration should be a Date');
    assert.strictEqual(createdPayload.isConfirmed, false, 'User should be unconfirmed by default');
    assert.ok(emailSent, 'Verification email should be sent');
    assert.strictEqual(emailSent.to, 'john@example.com', 'Email should be sent to the user');
    assert.strictEqual(emailSent.token, createdPayload.emailVerificationToken, 'Email should include token');
  } finally {
    models.User.findOne = originalFindOne;
    models.User.create = originalCreate;
    emailService.sendVerificationEmail = originalSendVerificationEmail;
  }
});

test('verifyEmail confirms user with valid token', async () => {
  const originalFindOne = models.User.findOne;

  const token = 'valid-token';
  const user = {
    id: 2,
    email: 'valid@example.com',
    is_admin: false,
    is_anonymous: false,
    isConfirmed: false,
    emailVerificationToken: token,
    emailVerificationTokenExpires: new Date(Date.now() + 60 * 1000),
    async save() {
      return this;
    },
    get(arg) {
      if (typeof arg === 'string') {
        return this[arg];
      }
      if (arg && arg.plain) {
        return {...this};
      }
      return {...this};
    }
  };

  models.User.findOne = async ({where}) => {
    return where.emailVerificationToken === token ? user : null;
  };

  const req = {query: {token}};
  const res = createMockRes();

  try {
    await authController.verifyEmail(req, res);

    assert.strictEqual(res.statusCode, 200, 'Should respond with HTTP 200');
    assert.strictEqual(user.isConfirmed, true, 'User should be confirmed');
    assert.strictEqual(user.emailVerificationToken, null, 'Token should be cleared');
    assert.strictEqual(user.emailVerificationTokenExpires, null, 'Token expiration should be cleared');
    assert.strictEqual(res.jsonPayload.message, 'Email успешно подтверждён');
    assert.ok(res.jsonPayload.user, 'Response should include user');
  } finally {
    models.User.findOne = originalFindOne;
  }
});

test('verifyEmail rejects expired token', async () => {
  const originalFindOne = models.User.findOne;

  const token = 'expired-token';
  const user = {
    id: 3,
    email: 'expired@example.com',
    isConfirmed: false,
    emailVerificationToken: token,
    emailVerificationTokenExpires: new Date(Date.now() - 60 * 1000),
    async save() {
      return this;
    }
  };

  models.User.findOne = async ({where}) => {
    return where.emailVerificationToken === token ? user : null;
  };

  const req = {query: {token}};
  const res = createMockRes();

  try {
    await authController.verifyEmail(req, res);

    assert.strictEqual(res.statusCode, 400, 'Should respond with HTTP 400');
    assert.strictEqual(res.jsonPayload.error, 'Токен истёк');
    assert.strictEqual(user.isConfirmed, false, 'User should remain unconfirmed');
  } finally {
    models.User.findOne = originalFindOne;
  }
});

test('login rejects unconfirmed users', async () => {
  const originalFindOne = models.User.findOne;

  const user = {
    id: 4,
    email: 'pending@example.com',
    isConfirmed: false,
    isValidPassword(password) {
      return password === 'secret';
    }
  };

  models.User.findOne = async ({where}) => {
    return where.email === user.email ? user : null;
  };

  const req = {body: {email: 'pending@example.com', password: 'secret'}};
  const res = createMockRes();

  try {
    await authController.login(req, res);

    assert.strictEqual(res.statusCode, 403, 'Should reject unconfirmed users');
    assert.strictEqual(res.jsonPayload.error, 'Аккаунт не подтверждён');
  } finally {
    models.User.findOne = originalFindOne;
  }
});
