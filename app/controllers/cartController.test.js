const test = require('node:test');
const assert = require('node:assert/strict');
const {Op} = require('sequelize');

// Provide dummy environment variables so that the models module can initialise
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

const cartController = require('./cartController');
const models = require('../models');
const {Cart} = models;

const createResponse = () => {
  const res = {
    statusCode: null,
    jsonCalls: []
  };
  res.status = function status(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function json(payload) {
    this.jsonCalls.push(payload);
    return this;
  };
  return res;
};

test('clearCart skips destroy when item list is empty', async () => {
  const req = {
    user: {id: 1},
    body: {itemIds: []}
  };
  const res = createResponse();

  const originalDestroy = Cart.destroy;
  let destroyCalled = false;
  Cart.destroy = async () => {
    destroyCalled = true;
  };

  try {
    await cartController.clearCart(req, res);
  } finally {
    Cart.destroy = originalDestroy;
  }

  assert.equal(destroyCalled, false);
  assert.equal(res.jsonCalls.length, 1);
  assert.deepEqual(res.jsonCalls[0], {
    success: true,
    message: 'Корзина очищена'
  });
});

test('clearCart only targets items owned by the user', async () => {
  const req = {
    user: {id: 42},
    body: {itemIds: [10, 11]}
  };
  const res = createResponse();

  const originalDestroy = Cart.destroy;
  const destroyArgs = [];
  Cart.destroy = async args => {
    destroyArgs.push(args);
    return 0;
  };

  try {
    await cartController.clearCart(req, res);
  } finally {
    Cart.destroy = originalDestroy;
  }

  assert.equal(destroyArgs.length, 1);
  assert.deepEqual(destroyArgs[0], {
    where: {
      user_id: 42,
      id: {
        [Op.in]: [10, 11]
      }
    }
  });
  assert.deepEqual(res.jsonCalls[0], {
    success: true,
    message: 'Корзина очищена'
  });
});
