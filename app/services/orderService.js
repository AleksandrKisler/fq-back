const {v4: uuidv4} = require('uuid');
const {sequelize, Order, OrderItem, Status} = require('../models');
const cartService = require('./cartService');
const yookassaService = require('./payments/yookassa');
const dolyamiService = require('./payments/dolyami');

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

const prepareDolyamiItems = cartItems => {
  const draftItems = cartItems.map((item, index) => ({
    id: item.id || item.product_id || index + 1,
    name: item.product?.title?.substring(0, 255) || 'Товар',
    quantity: Number(item.quantity) || 1,
    price: Number((item.price_at_add - item.discount_at_add).toFixed(2)),
    total: Number(item.totals?.total ?? ((item.price_at_add - item.discount_at_add) * item.quantity)),
    sku: item.variation?.sku || null
  }));

  return dolyamiService.normalizeItems(draftItems);
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
  returnUrl,
  payment
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

  const requestedPaymentMethod = typeof payment?.method === 'string'
    ? payment.method.trim().toLowerCase()
    : null;
  const allowedPaymentMethods = ['yookassa', 'dolyami', 'none'];

  if (requestedPaymentMethod && !allowedPaymentMethods.includes(requestedPaymentMethod)) {
    throw new OrderError('Некорректный способ оплаты', 400);
  }

  let paymentMethod = requestedPaymentMethod;
  if (!paymentMethod) {
    if (yookassaService.isConfigured()) {
      paymentMethod = 'yookassa';
    } else if (dolyamiService.isConfigured()) {
      paymentMethod = 'dolyami';
    } else {
      paymentMethod = 'none';
    }
  }

  if (paymentMethod === 'yookassa' && !yookassaService.isConfigured()) {
    if (requestedPaymentMethod) {
      throw new OrderError('Оплата через YooKassa недоступна', 503);
    }

    paymentMethod = dolyamiService.isConfigured() ? 'dolyami' : 'none';
  }

  if (paymentMethod === 'dolyami' && !dolyamiService.isConfigured()) {
    if (requestedPaymentMethod) {
      throw new OrderError('Оплата через Долями недоступна', 503);
    }

    paymentMethod = 'none';
  }

  const isPaymentPlanned = paymentMethod !== 'none';

  const status = await ensureStatus('Создан');
  const transaction = await sequelize.transaction();

  try {
    const orderMetadata = {
      cart_item_ids: items.map(item => item.id),
      payment: {method: paymentMethod}
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
      payment_status: isPaymentPlanned ? 'pending' : 'not_configured',
      payment_method: paymentMethod === 'none' ? null : paymentMethod,
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

    let paymentSummary = null;
    if (paymentMethod === 'yookassa') {
      const receiptItems = prepareReceiptItems(items);
      const paymentResponse = await yookassaService.createPayment({
        amount: totalAmount,
        returnUrl,
        description: `Заказ ${orderPlain.slug}`,
        customer,
        items: receiptItems,
        metadata: {
          orderId: orderPlain.id,
          orderSlug: orderPlain.slug,
          userId,
          ...(payment?.metadata && typeof payment.metadata === 'object' ? payment.metadata : {})
        }
      });

      await order.update({
        payment_id: paymentResponse.id,
        payment_status: paymentResponse.status,
        payment_method: paymentResponse.payment_method?.type || paymentMethod,
        payment_confirmation_url: paymentResponse.confirmation?.confirmation_url || null,
        payment_data: paymentResponse,
        currency: paymentResponse.amount?.currency || 'RUB'
      }, {transaction});

      paymentSummary = {
        id: paymentResponse.id,
        status: paymentResponse.status,
        confirmation_url: paymentResponse.confirmation?.confirmation_url || null,
        provider: 'yookassa'
      };
    }

    if (paymentMethod === 'dolyami') {
      const dolyamiItems = prepareDolyamiItems(items);
      const deliveryPayload = {
        method: deliveryMethod,
        address: deliveryAddress,
        cost: Number(deliveryCost.toFixed(2))
      };

      const dolyamiMetadata = {
        orderId: orderPlain.id,
        orderSlug: orderPlain.slug,
        userId,
        ...(payment?.metadata && typeof payment.metadata === 'object' ? payment.metadata : {})
      };

      const dolyamiOrder = await dolyamiService.createOrder({
        amount: totalAmount,
        orderId: orderPlain.id,
        orderSlug: orderPlain.slug,
        description: `Заказ ${orderPlain.slug}`,
        customer,
        items: dolyamiItems,
        metadata: dolyamiMetadata,
        successUrl: payment?.successUrl || returnUrl,
        failUrl: payment?.failUrl,
        cancelUrl: payment?.cancelUrl,
        delivery: deliveryPayload
      });

      const paymentId = dolyamiOrder?.order?.uuid
        || dolyamiOrder?.order?.id
        || dolyamiOrder?.uuid
        || dolyamiOrder?.id
        || null;
      const paymentStatus = dolyamiOrder?.order?.status
        || dolyamiOrder?.status
        || 'pending';
      const confirmationUrl = dolyamiOrder?.order?.checkout_url
        || dolyamiOrder?.checkout_url
        || dolyamiOrder?.confirmation_url
        || null;
      const currency = dolyamiOrder?.order?.amount?.currency
        || dolyamiOrder?.amount?.currency
        || 'RUB';

      await order.update({
        payment_id: paymentId,
        payment_status: paymentStatus,
        payment_method: 'dolyami',
        payment_confirmation_url: confirmationUrl,
        payment_data: dolyamiOrder,
        currency
      }, {transaction});

      paymentSummary = {
        id: paymentId,
        status: paymentStatus,
        confirmation_url: confirmationUrl,
        provider: 'dolyami'
      };
    }

    await transaction.commit();
    await order.reload({
      include: [{model: OrderItem, as: 'items'}]
    });

    return {
      order: toPlainOrder(order),
      payment: paymentSummary,
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

const tryFindOrderById = async idCandidate => {
  if (idCandidate === undefined || idCandidate === null || idCandidate === '') {
    return null;
  }

  const direct = await Order.findByPk(idCandidate);
  if (direct) {
    return direct;
  }

  const numeric = Number(idCandidate);
  if (!Number.isNaN(numeric) && String(numeric) !== '0') {
    const numericMatch = await Order.findByPk(numeric);
    if (numericMatch) {
      return numericMatch;
    }
  }

  return null;
};

const resolveOrderFromMetadata = async metadata => {
  if (!metadata || typeof metadata !== 'object') {
    throw new OrderError('Не удалось определить заказ для платежа', 400);
  }

  const idCandidates = [
    metadata.orderId,
    metadata.order_id,
    metadata.orderID,
    metadata.id,
    metadata.internal_id
  ];

  for (const candidate of idCandidates) {
    const order = await tryFindOrderById(candidate);
    if (order) {
      return order;
    }
  }

  const slugCandidates = [
    metadata.orderSlug,
    metadata.order_slug,
    metadata.slug
  ].filter(value => typeof value === 'string' && value.trim());

  for (const slug of slugCandidates) {
    const order = await Order.findOne({where: {slug}});
    if (order) {
      return order;
    }
  }

  throw new OrderError('Не удалось определить заказ для платежа', 400);
};

const extractDolyamiOrderPayload = payload => {
  if (payload && typeof payload === 'object') {
    if (payload.order && typeof payload.order === 'object') {
      return payload.order;
    }

    if (payload.object && typeof payload.object === 'object') {
      return payload.object;
    }
  }

  return payload;
};

const statusTitleByDolyamiStatus = {
  pending: 'Ожидает оплаты',
  new: 'Ожидает оплаты',
  waiting_for_payment: 'Ожидает оплаты',
  waiting_for_capture: 'Ожидает подтверждения',
  approved: 'Ожидает подтверждения',
  confirmed: 'Ожидает подтверждения',
  captured: 'Ожидает подтверждения',
  completed: 'Оплачен',
  paid: 'Оплачен',
  finished: 'Оплачен',
  succeeded: 'Оплачен',
  cancelled: 'Отменен',
  canceled: 'Отменен',
  rejected: 'Отменен',
  failed: 'Отменен',
  expired: 'Отменен',
  declined: 'Отменен'
};

const statusByDolyamiEvent = {
  'order.created': 'pending',
  'order.pending': 'pending',
  'order.waiting_for_payment': 'pending',
  'order.approved': 'approved',
  'order.confirmed': 'approved',
  'order.captured': 'approved',
  'order.completed': 'completed',
  'order.paid': 'completed',
  'order.finished': 'completed',
  'order.cancelled': 'cancelled',
  'order.canceled': 'canceled',
  'order.rejected': 'rejected',
  'order.failed': 'failed',
  'order.expired': 'expired'
};

const successStates = new Set(['completed', 'paid', 'finished', 'succeeded']);

const updateOrderFromDolyamiEvent = async payload => {
  const orderPayload = extractDolyamiOrderPayload(payload);
  const metadata = orderPayload?.metadata || payload?.metadata;

  const order = await resolveOrderFromMetadata(metadata);
  if (!order) {
    return null;
  }

  const rawStatus = orderPayload?.status || payload?.status || null;
  let normalizedStatus = rawStatus ? String(rawStatus).toLowerCase() : null;

  const eventName = typeof payload?.event === 'string' ? payload.event.toLowerCase() : null;
  if (!normalizedStatus && eventName && statusByDolyamiEvent[eventName]) {
    normalizedStatus = statusByDolyamiEvent[eventName];
  }

  const updateData = {
    payment_status: rawStatus || normalizedStatus || order.payment_status,
    payment_method: 'dolyami',
    payment_data: orderPayload,
    payment_id: orderPayload?.uuid || orderPayload?.id || order.payment_id,
    payment_confirmation_url: orderPayload?.checkout_url
      || orderPayload?.confirmation_url
      || order.payment_confirmation_url,
    currency: orderPayload?.amount?.currency || order.currency
  };

  const cancellationReason = orderPayload?.cancel_reason
    || orderPayload?.cancellation_reason
    || payload?.cancel_reason
    || payload?.cancellation_reason;

  if (cancellationReason) {
    updateData.cancellation_reason = cancellationReason;
  }

  const paidAtCandidate = orderPayload?.paid_at
    || orderPayload?.completed_at
    || orderPayload?.finished_at;

  if (paidAtCandidate) {
    updateData.paid_at = new Date(paidAtCandidate);
  } else if (normalizedStatus && successStates.has(normalizedStatus)) {
    updateData.paid_at = new Date();
  }

  if (normalizedStatus && statusTitleByDolyamiStatus[normalizedStatus]) {
    const nextStatus = await ensureStatus(statusTitleByDolyamiStatus[normalizedStatus]);
    updateData.status_id = nextStatus.id;
  }

  await order.update(updateData);

  if (normalizedStatus && successStates.has(normalizedStatus)) {
    const cartItemIds = Array.isArray(order.metadata?.cart_item_ids)
      ? order.metadata.cart_item_ids
      : [];

    if (cartItemIds.length) {
      try {
        await cartService.removeItems({userId: order.user_id, itemIds: cartItemIds});
      } catch (cartError) {
        console.error('Не удалось очистить корзину пользователя после оплаты Долями', cartError);
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
  prepareReceiptItems,
  updateOrderFromDolyamiEvent
};
