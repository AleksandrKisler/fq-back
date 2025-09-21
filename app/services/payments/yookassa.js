const axios = require('axios');
const {v4: uuidv4} = require('uuid');

const requiredEnvVars = ['YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY'];

const isConfigured = () => requiredEnvVars.every(name => Boolean(process.env[name]));

const getCredentials = () => {
  if (!isConfigured()) {
    throw new Error('Параметры YooKassa не настроены');
  }

  return {
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY
  };
};

const createPayment = async ({amount, returnUrl, description, customer, items, metadata}) => {
  const {shopId, secretKey} = getCredentials();
  const idempotenceKey = uuidv4();
  const formattedAmount = Number(amount).toFixed(2);
  const payload = {
    amount: {
      value: formattedAmount,
      currency: 'RUB'
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || process.env.YOOKASSA_RETURN_URL
    },
    description,
    metadata,
    receipt: {
      customer: {
        email: customer?.email || undefined,
        phone: customer?.phone || undefined,
        full_name: customer?.name || undefined
      },
      items: Array.isArray(items) ? items : []
    }
  };

  if (!payload.receipt.customer.email && !payload.receipt.customer.phone && !payload.receipt.customer.full_name) {
    delete payload.receipt.customer;
  }
  if (!payload.receipt.items.length) {
    delete payload.receipt.items;
  }
  if (!payload.receipt.customer && !payload.receipt.items) {
    delete payload.receipt;
  }

  try {
    const response = await axios.post('https://api.yookassa.ru/v3/payments', payload, {
      auth: {
        username: shopId,
        password: secretKey
      },
      headers: {
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    const err = new Error('Ошибка при создании платежа YooKassa');
    err.details = details;
    throw err;
  }
};

const isValidWebhookAuth = authHeader => {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  if (!isConfigured()) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [login, password] = decoded.split(':');

  return login === process.env.YOOKASSA_SHOP_ID && password === process.env.YOOKASSA_SECRET_KEY;
};

module.exports = {
  isConfigured,
  createPayment,
  isValidWebhookAuth
};
