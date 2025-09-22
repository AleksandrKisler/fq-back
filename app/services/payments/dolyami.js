const axios = require('axios');
const crypto = require('crypto');

const requiredEnvVars = ['DOLYAMI_API_KEY', 'DOLYAMI_SHOP_ID'];

const isConfigured = () => requiredEnvVars.every(name => Boolean(process.env[name]));

const getConfig = () => {
  if (!isConfigured()) {
    throw new Error('Параметры Долями не настроены');
  }

  return {
    apiKey: process.env.DOLYAMI_API_KEY,
    shopId: process.env.DOLYAMI_SHOP_ID,
    apiUrl: (process.env.DOLYAMI_API_URL || 'https://partner.dolyami.ru/api/v1').replace(/\/$/, ''),
    successUrl: process.env.DOLYAMI_SUCCESS_URL,
    failUrl: process.env.DOLYAMI_FAIL_URL,
    cancelUrl: process.env.DOLYAMI_CANCEL_URL,
    webhookSecret: process.env.DOLYAMI_WEBHOOK_SECRET
  };
};

const createClient = config => {
  return axios.create({
    baseURL: `${config.apiUrl}`,
    headers: {
      Authorization: `Token ${config.apiKey}`,
      'X-Shop-Id': config.shopId,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
};

const normalizeItems = items => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const price = Number(item.price ?? item.amount?.value ?? item.amount ?? 0);
    const quantity = Number(item.quantity ?? item.count ?? 1);

    return {
      external_id: String(item.external_id ?? item.id ?? item.product_id ?? index + 1),
      name: String(item.name ?? item.description ?? 'Товар').slice(0, 255),
      price: Number.isFinite(price) ? price : 0,
      quantity: Number.isFinite(quantity) ? quantity : 1,
      total: Number.isFinite(item.total)
        ? Number(item.total)
        : Number.isFinite(price * quantity)
          ? Number((price * quantity).toFixed(2))
          : 0,
      sku: item.sku || item.variation_sku || undefined
    };
  });
};

const withOptionalUrls = (payload, config, options = {}) => {
  if (!payload.success_url && (options.successUrl || config.successUrl)) {
    payload.success_url = options.successUrl || config.successUrl;
  }

  if (!payload.fail_url && (options.failUrl || config.failUrl)) {
    payload.fail_url = options.failUrl || config.failUrl;
  }

  if (!payload.cancel_url && (options.cancelUrl || config.cancelUrl)) {
    payload.cancel_url = options.cancelUrl || config.cancelUrl;
  }

  return payload;
};

const createOrder = async options => {
  const config = getConfig();
  const client = createClient(config);

  const {
    amount,
    orderId,
    orderSlug,
    description,
    customer,
    items,
    metadata,
    successUrl,
    failUrl,
    cancelUrl,
    delivery
  } = options;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Некорректная сумма заказа для Долями');
  }

  const payload = withOptionalUrls({
    order_id: orderSlug || String(orderId),
    amount: {
      value: Number(numericAmount.toFixed ? numericAmount.toFixed(2) : numericAmount),
      currency: 'RUB'
    },
    description: description || undefined,
    customer: customer
      ? {
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          name: customer.name || undefined
        }
      : undefined,
    items: normalizeItems(items),
    metadata: metadata || undefined,
    delivery: delivery || undefined
  }, config, {successUrl, failUrl, cancelUrl});

  if (!payload.items || !payload.items.length) {
    delete payload.items;
  }

  if (!payload.customer) {
    delete payload.customer;
  }

  if (!payload.metadata) {
    delete payload.metadata;
  }

  if (!payload.delivery) {
    delete payload.delivery;
  }

  try {
    const response = await client.post('/orders', payload);
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const err = new Error('Ошибка при создании заказа в Долями');
    err.details = details;
    throw err;
  }
};

const getOrder = async orderUuid => {
  const config = getConfig();
  const client = createClient(config);

  try {
    const response = await client.get(`/orders/${orderUuid}`);
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const err = new Error('Ошибка при получении заказа Долями');
    err.details = details;
    throw err;
  }
};

const cancelOrder = async (orderUuid, reason) => {
  const config = getConfig();
  const client = createClient(config);

  try {
    const response = await client.post(`/orders/${orderUuid}/cancel`, {
      reason: reason || 'cancelled_by_merchant'
    });
    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const err = new Error('Ошибка при отмене заказа Долями');
    err.details = details;
    throw err;
  }
};

const extractSignature = headers => {
  if (!headers) {
    return null;
  }

  return headers['x-dolyami-signature']
    || headers['x-signature']
    || headers['x-hub-signature-256']?.replace(/^sha256=/, '')
    || null;
};

const stringifyPayload = payload => {
  if (payload === undefined || payload === null) {
    return '';
  }

  if (Buffer.isBuffer(payload)) {
    return payload.toString('utf8');
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload === 'object') {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      return '';
    }
  }

  return String(payload);
};

const calculateSignature = (payload, secret) => {
  if (!secret) {
    return null;
  }

  const raw = stringifyPayload(payload);
  return crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
};

const isValidWebhookSignature = ({signature, payload}) => {
  const {webhookSecret} = getConfig();

  if (!webhookSecret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = calculateSignature(payload, webhookSecret);
  return Boolean(expected && expected === signature);
};

module.exports = {
  isConfigured,
  createOrder,
  getOrder,
  cancelOrder,
  extractSignature,
  isValidWebhookSignature,
  normalizeItems
};
