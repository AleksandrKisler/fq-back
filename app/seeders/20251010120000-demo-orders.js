'use strict';

const bcrypt = require('bcrypt');

const {Op, QueryTypes} = require('sequelize');

const ORDER_SLUGS = [
  'demo-order-001',
  'demo-order-002',
  'demo-order-003',
  'demo-order-004',
  'demo-order-005'
];

const STATUS_TITLES = {
  created: 'Создан',
  awaitingPayment: 'Ожидает оплаты',
  awaitingConfirmation: 'Ожидает подтверждения',
  paid: 'Оплачен',
  cancelled: 'Отменен'
};

const ORDERS = [
  {
    slug: 'demo-order-001',
    statusKey: 'created',
    orderDate: '2024-10-01T10:15:00Z',
    subtotal: 21500,
    discount: 0,
    deliveryCost: 500,
    total: 22000,
    deliveryMethod: 'Курьерская доставка',
    deliveryAddress: 'г. Москва, ул. Тверская, д. 1',
    customer: {
      email: 'maria.ivanova@example.com',
      phone: '+79000000001',
      name: 'Мария Иванова'
    },
    account: {
      password: 'DemoOrder001!',
      birthday: '1989-04-12'
    },
    comment: 'Позвонить за час до доставки',
    payment: {
      id: 'PAY-DEMO-001',
      status: 'pending',
      method: 'cash_on_delivery',
      confirmationUrl: 'https://pay.example.com/confirm/001',
      data: {
        status: 'pending',
        provider: 'demo-pay'
      }
    },
    metadata: {
      delivery_status: 'Готовится к отправке',
      delivery: {
        status: 'Готовится к отправке',
        eta: '2024-10-05'
      }
    }
  },
  {
    slug: 'demo-order-002',
    statusKey: 'awaitingPayment',
    orderDate: '2024-10-03T08:30:00Z',
    subtotal: 43500,
    discount: 3000,
    deliveryCost: 0,
    total: 40500,
    deliveryMethod: 'Самовывоз',
    deliveryAddress: 'г. Санкт-Петербург, Невский пр., д. 25',
    customer: {
      email: 'ivan.petrov@example.com',
      phone: '+79000000002',
      name: 'Иван Петров'
    },
    account: {
      password: 'DemoOrder002!',
      birthday: '1985-09-28'
    },
    comment: 'Заберу в выходные',
    payment: {
      id: 'PAY-DEMO-002',
      status: 'pending',
      method: 'bank_card',
      confirmationUrl: 'https://pay.example.com/invoice/002',
      data: {
        status: 'pending',
        type: 'card',
        paid: false
      }
    },
    metadata: {
      delivery_status: 'Ожидает оплаты',
      delivery: {
        status: 'Ожидает оплаты',
        pickup_code: 'SPB-002'
      }
    }
  },
  {
    slug: 'demo-order-003',
    statusKey: 'awaitingConfirmation',
    orderDate: '2024-10-05T14:45:00Z',
    subtotal: 62000,
    discount: 0,
    deliveryCost: 700,
    total: 62700,
    deliveryMethod: 'СДЭК',
    deliveryAddress: 'г. Екатеринбург, ул. Ленина, д. 50',
    trackingNumber: 'TRK-DEMO-003',
    customer: {
      email: 'olga.smirnova@example.com',
      phone: '+79000000003',
      name: 'Ольга Смирнова'
    },
    account: {
      password: 'DemoOrder003!',
      birthday: '1992-01-17'
    },
    payment: {
      id: 'PAY-DEMO-003',
      status: 'waiting_for_capture',
      method: 'yookassa_card',
      confirmationUrl: 'https://pay.example.com/confirm/003',
      data: {
        status: 'waiting_for_capture',
        paid: false
      }
    },
    metadata: {
      delivery_status: 'В пути',
      delivery: {
        status: 'В пути',
        tracking_status: 'Передано в курьерскую службу',
        company: 'СДЭК'
      }
    }
  },
  {
    slug: 'demo-order-004',
    statusKey: 'paid',
    orderDate: '2024-10-08T09:20:00Z',
    subtotal: 44500,
    discount: 2000,
    deliveryCost: 600,
    total: 43100,
    deliveryMethod: 'Курьерская доставка',
    deliveryAddress: 'г. Казань, ул. Баумана, д. 12',
    trackingNumber: 'TRK-DEMO-004',
    customer: {
      email: 'sergey.kuznetsov@example.com',
      phone: '+79000000004',
      name: 'Сергей Кузнецов'
    },
    account: {
      password: 'DemoOrder004!',
      birthday: '1983-06-04'
    },
    payment: {
      id: 'PAY-DEMO-004',
      status: 'succeeded',
      method: 'bank_card',
      confirmationUrl: null,
      paidAt: '2024-10-08T10:00:00Z',
      data: {
        status: 'succeeded',
        paid: true
      }
    },
    metadata: {
      delivery_status: 'Доставлен',
      delivery: {
        status: 'Доставлен',
        delivered_at: '2024-10-10'
      }
    }
  },
  {
    slug: 'demo-order-005',
    statusKey: 'cancelled',
    orderDate: '2024-10-09T16:10:00Z',
    subtotal: 25000,
    discount: 0,
    deliveryCost: 400,
    total: 25400,
    deliveryMethod: 'Почта России',
    deliveryAddress: 'г. Новосибирск, ул. Советская, д. 3',
    customer: {
      email: 'natalia.popova@example.com',
      phone: '+79000000005',
      name: 'Наталия Попова'
    },
    account: {
      password: 'DemoOrder005!',
      birthday: '1995-11-23'
    },
    comment: 'Отправить как подарок',
    payment: {
      id: 'PAY-DEMO-005',
      status: 'canceled',
      method: 'bank_card',
      confirmationUrl: 'https://pay.example.com/details/005',
      data: {
        status: 'canceled',
        reason: 'user_canceled'
      }
    },
    metadata: {
      delivery_status: 'Отменен',
      delivery: {
        status: 'Отменен'
      }
    },
    cancellationReason: 'Покупатель отменил заказ'
  }
];

const CUSTOMER_EMAILS = Array.from(new Set(ORDERS.map((order) => order.customer?.email).filter(Boolean)));

const serializeStructuredData = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
};

const ORDER_ITEMS_BY_SLUG = {
  'demo-order-001': [
    {
      product_id: 679907,
      product_title: 'Туфли женские из натуральной лакированной кожи на устойчивом каблуке',
      variation_id: 6799071,
      variation_sku: 'FQ-TUF-679907-V1',
      quantity: 1,
      unit_price: 21500,
      discount: 0,
      total_price: 21500,
      attributes: {
        Цвет: 'Бордовый',
        Размер: '37'
      }
    }
  ],
  'demo-order-002': [
    {
      product_id: 680106,
      product_title: 'Босоножки черная кожа с леопардовой подошвой',
      variation_id: 6801061,
      variation_sku: 'FQ-BOS-680106-V1',
      quantity: 1,
      unit_price: 19500,
      discount: 500,
      total_price: 19000,
      attributes: {
        Цвет: 'Черный',
        Размер: '38'
      }
    },
    {
      product_id: 679559,
      product_title: 'Ботильоны ворс пони леопард',
      variation_id: 6795591,
      variation_sku: 'FQ-BOT-679559-V1',
      quantity: 1,
      unit_price: 24000,
      discount: 2500,
      total_price: 21500,
      attributes: {
        Цвет: 'Леопард',
        Размер: '39'
      }
    }
  ],
  'demo-order-003': [
    {
      product_id: 679373,
      product_title: 'Туфли в натуральной коже белого цвета с переплетающимися ремешками',
      variation_id: 6793732,
      variation_sku: 'FQ-TUF-679373-V2',
      quantity: 1,
      unit_price: 21500,
      discount: 0,
      total_price: 21500,
      attributes: {
        Цвет: 'Белый',
        Размер: '36'
      }
    },
    {
      product_id: 679376,
      product_title: 'Босоножки черная кожа на толстом каблуке',
      variation_id: 6793761,
      variation_sku: 'FQ-BOS-679376-V1',
      quantity: 1,
      unit_price: 22500,
      discount: 0,
      total_price: 22500,
      attributes: {
        Цвет: 'Черный',
        Размер: '38'
      }
    },
    {
      product_id: 679523,
      product_title: 'Сапоги кофе с тиснением под кроко',
      variation_id: 6795231,
      variation_sku: 'FQ-SAP-679523-V1',
      quantity: 1,
      unit_price: 18000,
      discount: 0,
      total_price: 18000,
      attributes: {
        Цвет: 'Коричневый',
        Размер: '39'
      }
    }
  ],
  'demo-order-004': [
    {
      product_id: 680093,
      product_title: 'Туфли из натуральной черной кожи на шнуровке',
      variation_id: 6800932,
      variation_sku: 'FQ-TUF-680093-V2',
      quantity: 1,
      unit_price: 21500,
      discount: 1000,
      total_price: 20500,
      attributes: {
        Цвет: 'Черный',
        Размер: '38'
      }
    },
    {
      product_id: 680122,
      product_title: 'Босоножки с открытой пяткой и лео-подошвой',
      variation_id: 6801221,
      variation_sku: 'FQ-BOS-680122-V1',
      quantity: 1,
      unit_price: 23000,
      discount: 1000,
      total_price: 22000,
      attributes: {
        Цвет: 'Леопард',
        Размер: '39'
      }
    }
  ],
  'demo-order-005': [
    {
      product_id: 679567,
      product_title: 'Сапоги серебристый лак на невысоком каблуке',
      variation_id: 6795672,
      variation_sku: 'FQ-SAP-679567-V2',
      quantity: 1,
      unit_price: 25000,
      discount: 0,
      total_price: 25000,
      attributes: {
        Цвет: 'Серебристый',
        Размер: '37'
      }
    }
  ]
};

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const customerProfiles = new Map();

      for (const order of ORDERS) {
        const customer = order.customer || {};
        if (!customer.email) {
          continue;
        }

        const createdAt = new Date(order.orderDate);
        const account = order.account || {};
        const profile = customerProfiles.get(customer.email);

        if (!profile) {
          customerProfiles.set(customer.email, {
            email: customer.email,
            name: customer.name || 'Демо покупатель',
            phone: customer.phone || null,
            birthday: account.birthday || null,
            password: account.password || 'DemoOrder123!',
            createdAt,
            updatedAt: createdAt
          });
        } else {
          if (createdAt < profile.createdAt) {
            profile.createdAt = createdAt;
          }

          if (createdAt > profile.updatedAt) {
            profile.updatedAt = createdAt;
          }

          if (!profile.birthday && account.birthday) {
            profile.birthday = account.birthday;
          }

          if (!profile.password && account.password) {
            profile.password = account.password;
          }
        }
      }

      const customerList = Array.from(customerProfiles.values());
      let userIdByEmail = {};

      if (customerList.length) {
        const emails = customerList.map((profile) => profile.email);
        const existingUserRows = await queryInterface.sequelize.query(
          'SELECT id, email FROM users WHERE email IN (:emails)',
          {
            replacements: {emails},
            type: QueryTypes.SELECT,
            transaction
          }
        );

        const existingEmailSet = new Set(existingUserRows.map((row) => row.email));
        const customersToCreate = customerList.filter((profile) => !existingEmailSet.has(profile.email));

        if (customersToCreate.length) {
          const customerRecords = await Promise.all(
            customersToCreate.map(async (profile) => {
              const hashedPassword = await bcrypt.hash(profile.password, 10);
              return {
                name: profile.name,
                birthday: profile.birthday || null,
                email: profile.email,
                phone: profile.phone,
                is_confirmed: true,
                password: hashedPassword,
                email_verification_token: null,
                email_verification_token_expires: null,
                created_at: profile.createdAt,
                updated_at: profile.updatedAt,
                deleted_at: null,
                device_id: null,
                is_anonymous: false,
                is_admin: false
              };
            })
          );

          await queryInterface.bulkInsert('users', customerRecords, {transaction});
        }

        const userRows = await queryInterface.sequelize.query(
          'SELECT id, email FROM users WHERE email IN (:emails)',
          {
            replacements: {emails},
            type: QueryTypes.SELECT,
            transaction
          }
        );

        userIdByEmail = userRows.reduce((acc, row) => {
          acc[row.email] = row.id;
          return acc;
        }, {});
      }

      const statusTitles = Object.values(STATUS_TITLES);
      const statusRows = await queryInterface.sequelize.query(
        'SELECT id, title FROM statuses WHERE title IN (:titles)',
        {
          replacements: {titles: statusTitles},
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const statusMap = statusRows.reduce((acc, row) => {
        acc[row.title] = row.id;
        return acc;
      }, {});

      for (const title of statusTitles) {
        if (!statusMap[title]) {
          throw new Error(`Не найден статус заказа "${title}". Запустите миграцию с начальными статусами заказов.`);
        }
      }

      const ordersPayload = ORDERS.map((order) => {
        const createdAt = new Date(order.orderDate);
        const updatedAt = new Date(createdAt);
        const payment = order.payment || {};
        const customer = order.customer || {};
        const userId = customer.email ? userIdByEmail[customer.email] : null;

        if (customer.email && !userId) {
          throw new Error(`Не удалось определить пользователя для заказа ${order.slug}`);
        }

        return {
          slug: order.slug,
          user_id: userId || null,
          status_id: statusMap[STATUS_TITLES[order.statusKey]],
          order_date: new Date(order.orderDate),
          subtotal_amount: order.subtotal,
          total_discount: order.discount,
          delivery_method: order.deliveryMethod,
          delivery_address: order.deliveryAddress,
          tracking_number: order.trackingNumber || null,
          delivery_cost: order.deliveryCost,
          total_amount: order.total,
          customer_email: customer.email || null,
          customer_phone: customer.phone || null,
          customer_name: customer.name || null,
          comment: order.comment || null,
          payment_id: payment.id || null,
          payment_status: payment.status || null,
          payment_method: payment.method || null,
          payment_confirmation_url: payment.confirmationUrl || null,
          payment_data: serializeStructuredData(payment.data),
          currency: 'RUB',
          metadata: serializeStructuredData(order.metadata),
          paid_at: payment.paidAt ? new Date(payment.paidAt) : null,
          cancellation_reason: order.cancellationReason || null,
          created_at: createdAt,
          updated_at: updatedAt
        };
      });

      await queryInterface.bulkInsert('orders', ordersPayload, {transaction});

      const orderRows = await queryInterface.sequelize.query(
        'SELECT id, slug FROM orders WHERE slug IN (:slugs)',
        {
          replacements: {slugs: ORDER_SLUGS},
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const orderIdBySlug = orderRows.reduce((acc, row) => {
        acc[row.slug] = row.id;
        return acc;
      }, {});

      const itemsPayload = [];

      for (const order of ORDERS) {
        const orderId = orderIdBySlug[order.slug];
        if (!orderId) {
          throw new Error(`Не удалось определить идентификатор заказа для ${order.slug}`);
        }

        const items = ORDER_ITEMS_BY_SLUG[order.slug] || [];
        const createdAt = new Date(order.orderDate);
        const updatedAt = new Date(createdAt);

        items.forEach((item) => {
          itemsPayload.push({
            order_id: orderId,
            product_id: item.product_id,
            product_title: item.product_title,
            variation_id: item.variation_id,
            variation_sku: item.variation_sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            total_price: item.total_price,
            attributes: serializeStructuredData(item.attributes || {}),
            created_at: createdAt,
            updated_at: updatedAt
          });
        });
      }

      if (itemsPayload.length) {
        await queryInterface.bulkInsert('order_items', itemsPayload, {transaction});
      }
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const orderRows = await queryInterface.sequelize.query(
        'SELECT id FROM orders WHERE slug IN (:slugs)',
        {
          replacements: {slugs: ORDER_SLUGS},
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const orderIds = orderRows.map((row) => row.id);

      if (orderIds.length) {
        await queryInterface.bulkDelete('order_items', {order_id: {[Op.in]: orderIds}}, {transaction});
        await queryInterface.bulkDelete('orders', {id: {[Op.in]: orderIds}}, {transaction});
      }

      if (CUSTOMER_EMAILS.length) {
        await queryInterface.bulkDelete('users', {email: {[Op.in]: CUSTOMER_EMAILS}}, {transaction});
      }
    });
  }
};
