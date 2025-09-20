const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const controllerPath = path.resolve(__dirname, '../cartController.js');
const modelsPath = path.resolve(__dirname, '../../models/index.js');

const createResponse = () => {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
};

const withController = async (mocks, fn) => {
  const originalModelsCache = require.cache[modelsPath];
  const mockModule = new Module.Module(modelsPath);
  mockModule.filename = modelsPath;
  mockModule.paths = Module.Module._nodeModulePaths(path.dirname(modelsPath));
  mockModule.exports = {
    Cart: mocks.cart,
    Product: mocks.product,
    ProductVariation: mocks.productVariation
  };
  mockModule.loaded = true;
  require.cache[modelsPath] = mockModule;

  delete require.cache[controllerPath];
  const controller = require(controllerPath);

  try {
    await fn(controller);
  } finally {
    delete require.cache[controllerPath];
    if (originalModelsCache) {
      require.cache[modelsPath] = originalModelsCache;
    } else {
      delete require.cache[modelsPath];
    }
  }
};

test('cartController.addItem', async (t) => {
  await t.test('отклоняет вариацию другого товара', async () => {
    const cartCalls = [];
    const productMock = {
      findByPk: async () => ({id: 1, price: '100.00'})
    };
    const productVariationMock = {
      findByPk: async () => ({product_id: 2})
    };
    const cartMock = {
      findOrCreate: async (args) => {
        cartCalls.push(args);
        return [{id: 1, quantity: 1}, true];
      }
    };

    const req = {user: {id: 10}, body: {productId: 1, variationId: 50, quantity: 1}};
    const res = createResponse();

    await withController({cart: cartMock, product: productMock, productVariation: productVariationMock}, async ({addItem}) => {
      await addItem(req, res);

      assert.equal(res.statusCode, 400);
      assert.ok(res.body);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Неверная вариация товара');
      assert.equal(cartCalls.length, 0);
    });
  });

  await t.test('использует цену вариации и добавляет товар, если она принадлежит продукту', async () => {
    const cartCalls = [];
    const productMock = {
      findByPk: async () => ({id: 1, price: '100.00'})
    };
    const variationPrice = '120.50';
    const productVariationMock = {
      findByPk: async () => ({product_id: 1, price: variationPrice})
    };
    const cartItem = {id: 25, quantity: 2};
    const cartMock = {
      findOrCreate: async (args) => {
        cartCalls.push(args);
        return [cartItem, true];
      }
    };

    const req = {user: {id: 10}, body: {productId: 1, variationId: 60, quantity: 2}};
    const res = createResponse();

    await withController({cart: cartMock, product: productMock, productVariation: productVariationMock}, async ({addItem}) => {
      await addItem(req, res);

      assert.equal(cartCalls.length, 1);
      const callArgs = cartCalls[0];
      assert.deepEqual(callArgs.where, {
        user_id: 10,
        product_id: 1,
        variation_id: 60
      });
      assert.equal(callArgs.defaults.price_at_add, variationPrice);
      assert.equal(callArgs.defaults.quantity, 2);

      assert.ok(res.body);
      assert.equal(res.body.success, true);
      assert.deepEqual(res.body.data, cartItem);
    });
  });
});
