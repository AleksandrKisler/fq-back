process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

const assert = require('assert');

const models = require('../models');

const originalFindAll = models.Cart.findAll;

const sampleItems = [
  {
    id: 101,
    user_id: 1,
    quantity: 2,
    price_at_add: '150.50',
    discount_at_add: '10.25',
    attributes: {color: 'red'},
    product: {id: 11, title: 'Product A', slug: 'product-a', price: '200.00'},
    variation: {id: 21, sku: 'SKU-A', stock_quantity: 3}
  },
  {
    id: 102,
    user_id: 2,
    quantity: 1,
    price_at_add: '99.99',
    discount_at_add: '0.00',
    attributes: {color: 'blue'},
    product: {id: 12, title: 'Product B', slug: 'product-b', price: '110.00'},
    variation: {id: 22, sku: 'SKU-B', stock_quantity: 5}
  }
];

models.Cart.findAll = async ({where}) => {
  return sampleItems
    .filter(item => item.user_id === where.user_id)
    .map(item => ({...item}));
};

const {getCart} = require('../controllers/cartController');

(async () => {
  const req = {user: {id: 1}};
  const res = {
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

  await getCart(req, res);

  assert.strictEqual(res.statusCode, 200, 'Should respond with HTTP 200');
  assert.ok(res.jsonPayload, 'Should return payload');
  assert.strictEqual(res.jsonPayload.success, true, 'Success flag should be true');

  const {items, total, discount, totalWithDiscount} = res.jsonPayload.data;

  assert.strictEqual(items.length, 1, 'Should only return items for the current user');
  assert.strictEqual(items[0].id, 101, 'Returned item should match the current user');
  assert.deepStrictEqual(items[0].product, sampleItems[0].product, 'Product details should be included');
  assert.deepStrictEqual(items[0].variation, sampleItems[0].variation, 'Variation details should be included');

  const expectedTotal = 150.5 * 2;
  const expectedDiscount = 10.25 * 2;
  const expectedTotalWithDiscount = expectedTotal - expectedDiscount;

  assert.strictEqual(Number(total), Number(expectedTotal.toFixed(2)), 'Total should be calculated correctly');
  assert.strictEqual(Number(discount), Number(expectedDiscount.toFixed(2)), 'Discount should be calculated correctly');
  assert.strictEqual(
    Number(totalWithDiscount),
    Number(expectedTotalWithDiscount.toFixed(2)),
    'Total with discount should be calculated correctly'
  );

  console.log('✅ cartController.getCart returns only items belonging to the user with correct totals');
})()
  .catch(err => {
    console.error('❌ cartController.getCart test failed');
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    models.Cart.findAll = originalFindAll;
  });
