const {
  sequelize,
  Sequelize,
  Order,
  OrderItem,
  Status,
  User
} = require('../models');

const {Op} = Sequelize;

const DEFAULT_PERIOD_DAYS = 30;
const PAID_STATUS_TITLES = ['Оплачен'];
const CANCELLED_STATUS_TITLES = ['Отменен'];

class DashboardRangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DashboardRangeError';
    this.code = 'INVALID_DASHBOARD_RANGE';
  }
}

const toNumber = (value) => {
  if (value === null || typeof value === 'undefined') {
    return 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toCurrency = (value) => {
  const numeric = toNumber(value);
  return Math.round(numeric * 100) / 100;
};

const normalizeStatusValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new DashboardRangeError('Некорректный формат даты');
  }

  return date;
};

const normalizeRange = ({startDate, endDate} = {}) => {
  const end = parseDateInput(endDate) ?? new Date();
  const start = parseDateInput(startDate) ?? new Date(end);

  if (!startDate) {
    start.setDate(start.getDate() - (DEFAULT_PERIOD_DAYS - 1));
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start > end) {
    throw new DashboardRangeError('Дата начала периода должна быть раньше даты окончания');
  }

  return {start, end};
};

const buildStatusMap = async () => {
  const titles = Array.from(new Set([...PAID_STATUS_TITLES, ...CANCELLED_STATUS_TITLES]));

  if (titles.length === 0) {
    return {paidStatusIds: [], cancelledStatusIds: []};
  }

  const statuses = await Status.findAll({
    where: {title: {[Op.in]: titles}},
    attributes: ['id', 'title'],
    raw: true
  });

  const paid = statuses
    .filter((status) => PAID_STATUS_TITLES.includes(status.title))
    .map((status) => status.id);

  const cancelled = statuses
    .filter((status) => CANCELLED_STATUS_TITLES.includes(status.title))
    .map((status) => status.id);

  return {
    paidStatusIds: paid,
    cancelledStatusIds: cancelled
  };
};

const fetchSummary = async (baseWhere, {paidStatusIds, cancelledStatusIds}) => {
  const [totalOrders, paidOrders, cancelledOrders] = await Promise.all([
    Order.count({where: baseWhere}),
    paidStatusIds.length
      ? Order.count({where: {...baseWhere, status_id: {[Op.in]: paidStatusIds}}})
      : Promise.resolve(0),
    cancelledStatusIds.length
      ? Order.count({where: {...baseWhere, status_id: {[Op.in]: cancelledStatusIds}}})
      : Promise.resolve(0)
  ]);

  let totalRevenue = 0;

  if (paidStatusIds.length) {
    const revenue = await Order.sum('total_amount', {
      where: {...baseWhere, status_id: {[Op.in]: paidStatusIds}}
    });

    totalRevenue = toCurrency(revenue);
  }

  const averageOrderValue = paidOrders > 0
    ? toCurrency(totalRevenue / paidOrders)
    : 0;

  return {
    totalOrders,
    paidOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue
  };
};

const fetchOrdersByStatus = async (baseWhere) => {
  const sumTotal = Sequelize.fn(
    'COALESCE',
    Sequelize.fn(
      'SUM',
      Sequelize.cast(Sequelize.col('Order.total_amount'), 'numeric')
    ),
    0
  );

  const rows = await Order.findAll({
    attributes: [
      [Sequelize.col('status.title'), 'status'],
      [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'ordersCount'],
      [sumTotal, 'revenue']
    ],
    include: [{model: Status, as: 'status', attributes: []}],
    where: baseWhere,
    group: ['status.id', 'status.title'],
    raw: true
  });

  return rows
    .map((row) => ({
      status: row.status || 'Без статуса',
      ordersCount: toNumber(row.ordersCount),
      revenue: toCurrency(row.revenue)
    }))
    .sort((a, b) => b.ordersCount - a.ordersCount);
};

const fetchRevenueTrend = async (baseWhere, {paidStatusIds}) => {
  if (!paidStatusIds.length) {
    return [];
  }

  const [rows] = await sequelize.query(
    `
      SELECT
        DATE_TRUNC('day', o.created_at) AS bucket,
        COUNT(o.id)::int AS orders_count,
        COALESCE(SUM(o.total_amount::numeric), 0)::float AS revenue
      FROM orders o
      WHERE o.created_at BETWEEN :start AND :end
        AND o.status_id IN (:paidStatusIds)
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    {
      replacements: {
        start: baseWhere.created_at[Op.between][0],
        end: baseWhere.created_at[Op.between][1],
        paidStatusIds
      }
    }
  );

  return rows.map((row) => ({
    date: new Date(row.bucket).toISOString(),
    ordersCount: toNumber(row.orders_count),
    revenue: toCurrency(row.revenue)
  }));
};

const fetchTopProducts = async (baseWhere, {paidStatusIds}) => {
  if (!paidStatusIds.length) {
    return [];
  }

  const [rows] = await sequelize.query(
    `
      SELECT
        oi.product_id,
        COALESCE(NULLIF(oi.product_title, ''), p.title, 'Неизвестный товар') AS title,
        SUM(oi.quantity)::int AS units_sold,
        COALESCE(SUM(oi.total_price::numeric), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.created_at BETWEEN :start AND :end
        AND o.status_id IN (:paidStatusIds)
      GROUP BY oi.product_id, title
      ORDER BY revenue DESC, units_sold DESC
      LIMIT 5
    `,
    {
      replacements: {
        start: baseWhere.created_at[Op.between][0],
        end: baseWhere.created_at[Op.between][1],
        paidStatusIds
      }
    }
  );

  return rows.map((row) => ({
    productId: row.product_id,
    title: row.title,
    unitsSold: toNumber(row.units_sold),
    revenue: toCurrency(row.revenue)
  }));
};

const resolveDeliveryStatus = (order) => {
  const directStatus = normalizeStatusValue(order.delivery_status);
  if (directStatus) {
    return directStatus;
  }

  const metadata = order.metadata && typeof order.metadata === 'object'
    ? order.metadata
    : null;

  if (!metadata) {
    return null;
  }

  const deliveryMeta = metadata.delivery && typeof metadata.delivery === 'object'
    ? metadata.delivery
    : null;

  const candidates = [
    metadata.delivery_status,
    metadata.deliveryState,
    metadata.fulfillment_status,
    metadata.fulfillmentStatus
  ];

  if (deliveryMeta) {
    candidates.unshift(
      deliveryMeta.status,
      deliveryMeta.state,
      deliveryMeta.stage,
      deliveryMeta.tracking_status,
      deliveryMeta.fulfillment_status
    );
  }

  for (const candidate of candidates) {
    const normalized = normalizeStatusValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const fetchRecentOrders = async (baseWhere) => {
  const orders = await Order.findAll({
    where: baseWhere,
    include: [
      {model: Status, as: 'status', attributes: ['id', 'title']},
      {model: OrderItem, as: 'items', attributes: ['id', 'product_id', 'product_title', 'quantity', 'total_price']},
      {model: User, as: 'user', attributes: ['id', 'name', 'email']}
    ],
    order: [['created_at', 'DESC']],
    limit: 10,
    distinct: true
  });

  return orders.map((order) => {
    const plain = typeof order.get === 'function' ? order.get({plain: true}) : order;
    const items = Array.isArray(plain.items)
      ? plain.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        title: item.product_title,
        quantity: toNumber(item.quantity),
        totalPrice: toCurrency(item.total_price)
      }))
      : [];

    return {
      id: plain.id,
      slug: plain.slug,
      statusId: plain.status?.id ?? null,
      status: plain.status?.title ?? null,
      paymentStatus: normalizeStatusValue(plain.payment_status),
      deliveryStatus: resolveDeliveryStatus(plain),
      totalAmount: toCurrency(plain.total_amount),
      createdAt: plain.created_at instanceof Date ? plain.created_at.toISOString() : new Date(plain.created_at).toISOString(),
      customer: plain.user
        ? {
            id: plain.user.id,
            name: plain.user.name,
            email: plain.user.email
          }
        : null,
      items
    };
  });
};

const fetchCustomersSummary = async (baseWhere) => {
  const [rows] = await sequelize.query(
    `
      WITH range_orders AS (
        SELECT DISTINCT o.user_id
        FROM orders o
        WHERE o.user_id IS NOT NULL
          AND o.created_at BETWEEN :start AND :end
      ),
      previous_orders AS (
        SELECT DISTINCT o.user_id
        FROM orders o
        JOIN range_orders ro ON ro.user_id = o.user_id
        WHERE o.created_at < :start
      )
      SELECT
        (SELECT COUNT(*) FROM users u WHERE COALESCE(u.is_admin, false) = false)::int AS total_customers,
        (SELECT COUNT(*) FROM users u WHERE COALESCE(u.is_admin, false) = false AND u.created_at BETWEEN :start AND :end)::int AS new_customers,
        (SELECT COUNT(*) FROM range_orders)::int AS active_customers,
        (SELECT COUNT(*) FROM previous_orders)::int AS returning_customers
    `,
    {
      replacements: {
        start: baseWhere.created_at[Op.between][0],
        end: baseWhere.created_at[Op.between][1]
      }
    }
  );

  const summary = rows[0] || {
    total_customers: 0,
    new_customers: 0,
    active_customers: 0,
    returning_customers: 0
  };

  return {
    total: toNumber(summary.total_customers),
    new: toNumber(summary.new_customers),
    active: toNumber(summary.active_customers),
    returning: toNumber(summary.returning_customers)
  };
};

const getDashboardOverview = async ({startDate, endDate} = {}) => {
  const {start, end} = normalizeRange({startDate, endDate});
  const baseWhere = {
    created_at: {
      [Op.between]: [start, end]
    }
  };

  const statusMap = await buildStatusMap();

  const [summary, ordersByStatus, revenueTrend, topProducts, recentOrders, customers] = await Promise.all([
    fetchSummary(baseWhere, statusMap),
    fetchOrdersByStatus(baseWhere),
    fetchRevenueTrend(baseWhere, statusMap),
    fetchTopProducts(baseWhere, statusMap),
    fetchRecentOrders(baseWhere),
    fetchCustomersSummary(baseWhere)
  ]);

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    summary: {
      ...summary,
      customers
    },
    ordersByStatus,
    revenueTrend,
    topProducts,
    recentOrders
  };
};

module.exports = {
  getDashboardOverview,
  DashboardRangeError
};
