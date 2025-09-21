const {v4: uuidv4} = require('uuid');
const {sequelize, Order, OrderItem, Status} = require('../models');
const cartService = require('./cartService');
const yookassaService = require('./payments/yookassa');

class OrderError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'OrderError';
    this.statusCode = statusCode;
  }
}

const ensureStatus = async title => {
  const [status] = await Status.findOrCreate({
    where: {title},
    defaults: {title}
  });

  return status;
};

const generateOrderSlug = () => {
  const shortUuid = uuidv4().split('-')[0].toUpperCase();
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${timestamp}-${shortUuid}`;
};

const toPlainOrder = orderInstance => {
  const plain = typeof orderInstance.get === 'function' ? orderInstance.get({plain: true}) : orderInstance;

  if (plain.items) {
    plain.items = plain.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount: Number(item.discount),
      total_price: Number(item.total_price)
    }));
  }

  if (plain.total_amount !== undefined) {
    plain.total_amount = Number(plain.total_amount);
  }

  if (plain.subtotal_amount !== undefined) {
    plain.subtotal_amount = Number(plain.subtotal_amount);
  }

  if (plain.total_discount !== undefined) {
    plain.total_discount = Number(plain.total_discount);
  }

  if (plain.delivery_cost !== undefined) {
    plain.delivery_cost = Number(plain.delivery_cost);
  }

  return plain;
};

const prepareReceiptItems = cartItems => {
  return cartItems.map(item => ({
    description: item.product?.title?.substring(0, 128) || 'Товар',
    quantity: item.quantity,
    amount: {
      value: (item.price_at_add - item.discount_at_add).toFixed(2),
      currency: 'RUB'
    },
    vat_code: 1
  }));
};

const sanitizeObject = obj => Object.fromEntries(
  Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const getDefaultFulfillmentType = method => {
  if (!method) {
    return null;
  }

  const normalized = String(method).toLowerCase();

  if (normalized === 'store_pickup' || normalized === 'store') {
    return 'store_pickup';
  }

  if (normalized === 'cdek_pvz' || normalized === 'cdek') {
    return 'cdek_pvz';
  }

  return null;
};

const extractDeliveryMetadata = (delivery, method) => {
  if (!delivery || typeof delivery !== 'object') {
    return null;
  }

  let metadata;

  if (delivery.metadata && typeof delivery.metadata === 'object') {
    metadata = sanitizeObject(delivery.metadata);
  } else {
    const {method: _method, address: _address, cost: _cost, metadata: _metadata, ...rest} = delivery;
    metadata = sanitizeObject(rest);
  }

  if (metadata.variant && !metadata.fulfillment_type) {
    metadata.fulfillment_type = metadata.variant;
  }

  const defaultType = getDefaultFulfillmentType(method);

  if (defaultType && !metadata.fulfillment_type) {
    metadata.fulfillment_type = defaultType;
  }

  if (Object.keys(metadata).length === 0) {
    return defaultType ? {fulfillment_type: defaultType} : null;
  }

  return metadata;
};

const resolveDeliveryAddress = (delivery, metadata, method) => {
  const directAddress = typeof delivery.address === 'string' ? delivery.address.trim() : '';
  if (directAddress) {
    return directAddress;
  }

  const meta = metadata || {};
  const addressCandidates = [
    meta.address_full,
    meta.full_address,
    meta.address,
    meta.pickup_address,
    meta.store_address
  ];

  for (const candidate of addressCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (method === 'store_pickup' && typeof meta.store_name === 'string' && meta.store_name.trim()) {
    return `Самовывоз: ${meta.store_name.trim()}`;
  }

  if (method === 'cdek_pvz') {
    const pointName = typeof meta.name === 'string' ? meta.name.trim() : '';
    const city = typeof meta.city === 'string' ? meta.city.trim() : '';

    if (pointName && city) {
      return `${city}, ${pointName}`;
    }

    if (pointName) {
      return pointName;
    }
  }

  return '';
};

const normalizeDeliveryPayload = rawDelivery => {
  if (!rawDelivery || typeof rawDelivery !== 'object') {
    throw new OrderError('Не указаны параметры доставки', 400);
  }

  const method = typeof rawDelivery.method === 'string' ? rawDelivery.method.trim() : '';
  if (!method) {
    throw new OrderError('Не указан способ доставки', 400);
  }

  const cost = Number(rawDelivery.cost ?? 0);
  if (!Number.isFinite(cost) || cost < 0) {
    throw new OrderError('Некорректная стоимость доставки', 400);
  }

  const metadata = extractDeliveryMetadata(rawDelivery, method);
  const address = resolveDeliveryAddress(rawDelivery, metadata, method);

  if (!address) {
    throw new OrderError('Не указан адрес доставки', 400);
  }

  return {
    method,
    cost,
    address,
    metadata
  };
};

const createOrderFromCart = async ({
  userId,
  delivery,
  customer,
  comment,
  returnUrl
}) => {
  const {items, totals} = await cartService.getCartItems(userId);

  if (!items.length) {
    throw new OrderError('Корзина пуста', 400);
  }

  const normalizedDelivery = normalizeDeliveryPayload(delivery);
  const {
    method: deliveryMethod,
    address: deliveryAddress,
    cost: deliveryCost,
    metadata: deliveryMetadata
  } = normalizedDelivery;

  const subtotal = totals.total;
  const discountTotal = totals.discount;
  const totalAmount = subtotal + deliveryCost;

  if (totalAmount <= 0) {
    throw new OrderError('Сумма заказа должна быть больше 0', 400);
  }

  const status = await ensureStatus('Создан');
  const transaction = await sequelize.transaction();

  try {
    const orderMetadata = {
      cart_item_ids: items.map(item => item.id)
    };

    if (deliveryMetadata) {
      orderMetadata.delivery = deliveryMetadata;
    }

    const order = await Order.create({
      slug: generateOrderSlug(),
      user_id: userId,
      status_id: status.id,
      order_date: new Date(),
      subtotal_amount: subtotal,
      total_discount: discountTotal,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      delivery_cost: deliveryCost,
      total_amount: totalAmount,
      currency: 'RUB',
      payment_status: yookassaService.isConfigured() ? 'pending' : 'not_configured',
      comment: comment || null,
      customer_email: customer?.email || null,
      customer_phone: customer?.phone || null,
      customer_name: customer?.name || null,
      metadata: orderMetadata
    }, {transaction});

    const orderItemsPayload = items.map(item => ({
      order_id: order.id,
      product_id: item.product?.id || item.product_id,
      product_title: item.product?.title || null,
      variation_id: item.variation?.id || item.variation_id || null,
      variation_sku: item.variation?.sku || null,
      quantity: item.quantity,
      unit_price: item.price_at_add,
      discount: item.discount_at_add,
      total_price: item.totals.total,
      attributes: item.attributes || {}
    }));

    await OrderItem.bulkCreate(orderItemsPayload, {transaction});

    const orderPlain = toPlainOrder(order);

    let payment = null;
    if (yookassaService.isConfigured()) {
      const receiptItems = prepareReceiptItems(items);
      payment = await yookassaService.createPayment({
        amount: totalAmount,
        returnUrl,
        description: `Заказ ${orderPlain.slug}`,
        customer,
        items: receiptItems,
        metadata: {
          orderId: orderPlain.id,
          orderSlug: orderPlain.slug,
          userId
        }
      });

      await order.update({
        payment_id: payment.id,
        payment_status: payment.status,
        payment_method: payment.payment_method?.type || null,
        payment_confirmation_url: payment.confirmation?.confirmation_url || null,
        payment_data: payment,
        currency: payment.amount?.currency || 'RUB'
      }, {transaction});
    }

    await transaction.commit();
    await order.reload({
      include: [{model: OrderItem, as: 'items'}]
    });

    return {
      order: toPlainOrder(order),
      payment: payment ? {
        id: payment.id,
        status: payment.status,
        confirmation_url: payment.confirmation?.confirmation_url || null
      } : null,
      totals: {
        subtotal,
        discount: discountTotal,
        delivery: deliveryCost,
        total: totalAmount
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getOrderBySlug = async ({slug, userId}) => {
  const order = await Order.findOne({
    where: {slug, user_id: userId},
    include: [
      {model: OrderItem, as: 'items'},
      {model: Status, as: 'status'}
    ]
  });

  if (!order) {
    throw new OrderError('Заказ не найден', 404);
  }

  return toPlainOrder(order);
};

const updateOrderFromPaymentEvent = async ({event, object}) => {
  if (!object || !object.metadata || !object.metadata.orderId) {
    throw new OrderError('Не удалось определить заказ для платежа', 400);
  }

  const order = await Order.findByPk(object.metadata.orderId);
  if (!order) {
    return null;
  }

  const statusTitleByEvent = {
    'payment.waiting_for_capture': 'Ожидает подтверждения',
    'payment.succeeded': 'Оплачен',
    'payment.canceled': 'Отменен',
    'payment.pending': 'Ожидает оплаты'
  };

  const nextStatusTitle = statusTitleByEvent[event];
  const updateData = {
    payment_status: object.status || nextStatusTitle || order.payment_status,
    payment_method: object.payment_method?.type || order.payment_method,
    payment_data: object,
    currency: object.amount?.currency || order.currency,
    payment_confirmation_url: object.confirmation?.confirmation_url || order.payment_confirmation_url,
    payment_id: object.id || order.payment_id
  };

  if (object.cancellation_details?.reason) {
    updateData.cancellation_reason = object.cancellation_details.reason;
  }

  if (!updateData.cancellation_reason && object.cancellation_details?.description) {
    updateData.cancellation_reason = object.cancellation_details.description;
  }

  if (object.captured_at) {
    updateData.paid_at = new Date(object.captured_at);
  }

  if (!updateData.paid_at && object.status === 'succeeded') {
    updateData.paid_at = new Date(object.created_at || Date.now());
  }

  if (nextStatusTitle) {
    const status = await ensureStatus(nextStatusTitle);
    updateData.status_id = status.id;
  }

  await order.update(updateData);

  if (event === 'payment.succeeded') {
    const cartItemIds = Array.isArray(order.metadata?.cart_item_ids)
      ? order.metadata.cart_item_ids
      : [];

    if (cartItemIds.length) {
      try {
        await cartService.removeItems({userId: order.user_id, itemIds: cartItemIds});
      } catch (cartError) {
        console.error('Не удалось очистить корзину пользователя после оплаты', cartError);
      }
    }
  }

  return order;
};

module.exports = {
  OrderError,
  createOrderFromCart,
  getOrderBySlug,
  updateOrderFromPaymentEvent,
  prepareReceiptItems
};
