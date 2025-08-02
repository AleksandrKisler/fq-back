// 'use strict';
// const bcrypt = require('bcrypt');
//
module.exports = {
  async up(queryInterface, Sequelize) {
//     await queryInterface.sequelize.transaction(async (transaction) => {
//       // Таблицы без зависимостей
//       await queryInterface.createTable('users', {
//         id: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
//         name: {type: Sequelize.STRING(100), allowNull: false},
//         birthday: {type: Sequelize.DATEONLY, allowNull: true},
//         email: {type: Sequelize.STRING(100), allowNull: false, unique: true},
//         phone: {type: Sequelize.STRING(15), allowNull: true, unique: true},
//         is_confirmed: {type: Sequelize.BOOLEAN, allowNull: true, default: false},
//         password: {type: Sequelize.STRING(150), allowNull: false},
//         email_verification_token: {type: Sequelize.STRING(150), allowNull: true},
//         email_verification_token_expires: {type: Sequelize.STRING(150), allowNull: true},
//         created_at: {type: Sequelize.DATE, allowNull: false},
//         updated_at: {type: Sequelize.DATE, allowNull: true},
//         deleted_at: {type: Sequelize.DATE, allowNull: true},
//       }, {
//         transaction
//       });
//
//       await queryInterface.createTable('articles', {
//         id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           autoIncrement: true
//         },
//         title: {
//           type: Sequelize.STRING(255),
//           allowNull: false
//         },
//         slug: {
//           type: Sequelize.STRING(255),
//           allowNull: false,
//           unique: true
//         },
//         excerpt: {
//           type: Sequelize.TEXT,
//           allowNull: true
//         },
//         content: {
//           type: Sequelize.TEXT,
//           allowNull: false
//         },
//         main_image: {
//           type: Sequelize.STRING(500),
//           allowNull: true
//         },
//         publish_date: {
//           type: Sequelize.DATEONLY,
//           allowNull: false
//         },
//         meta_title: {
//           type: Sequelize.STRING(255),
//           allowNull: true
//         },
//         meta_description: {
//           type: Sequelize.TEXT,
//           allowNull: true
//         },
//         deleted_at: {
//           type: Sequelize.DATE,
//           allowNull: true
//         },
//         is_active: {  // Новое поле
//           type: Sequelize.BOOLEAN,
//           allowNull: false,
//           defaultValue: true
//         },
//         created_at: {
//           type: Sequelize.DATE,
//           allowNull: false,
//           defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
//         },
//         updated_at: {
//           type: Sequelize.DATE,
//           allowNull: false,
//           defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
//         }
//       });
//
//       await queryInterface.addIndex('articles', ['slug'], { unique: true });
//       await queryInterface.addIndex('articles', ['is_active']);
//       await queryInterface.addIndex('articles', ['deleted_at']);
//
//
//
//       await queryInterface.createTable('statuses', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         title: { type: Sequelize.STRING(255), allowNull: false }
//       }, { transaction });
//
//       await queryInterface.createTable('categories', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         title: { type: Sequelize.STRING(255), allowNull: false },
//         slug: { type: Sequelize.STRING(255), allowNull: false, unique: true }
//       }, { transaction });
//
//       await queryInterface.createTable('attributes', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         name: { type: Sequelize.STRING(255), allowNull: false, unique: true }
//       }, { transaction });
//
//       await queryInterface.createTable('discounts', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         name: { type: Sequelize.STRING(255), allowNull: false },
//         type: { type: Sequelize.ENUM('percent', 'fixed'), allowNull: false },
//         value: { type: Sequelize.DECIMAL(8,2), allowNull: false },
//         start_date: { type: Sequelize.DATE, allowNull: false },
//         end_date: { type: Sequelize.DATE, allowNull: false },
//         max_users: { type: Sequelize.BIGINT, allowNull: false },
//         min_order_amount: { type: Sequelize.DECIMAL(8,2), allowNull: false },
//         is_active: { type: Sequelize.BOOLEAN, allowNull: false }
//       }, { transaction });
//
//       await queryInterface.createTable('collections', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         title: { type: Sequelize.STRING(255), allowNull: false },
//         description: { type: Sequelize.TEXT, allowNull: false },
//         is_active: { type: Sequelize.BOOLEAN, allowNull: false }
//       }, { transaction });
//
//       // Зависимые таблицы
//       await queryInterface.createTable('products', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         sku: { type: Sequelize.STRING(255), allowNull: false },
//         title: { type: Sequelize.STRING(255), allowNull: false },
//         category_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'categories', key: 'id' }
//         },
//         description: { type: Sequelize.TEXT, allowNull: false },
//         slug: { type: Sequelize.STRING(255), allowNull: false, unique: true }
//       }, { transaction });
//
//       await queryInterface.createTable('attribute_values', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         attribute_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'attributes', key: 'id' }
//         },
//         value: { type: Sequelize.STRING(255), allowNull: false },
//         hex_code: { type: Sequelize.STRING(255) }
//       }, { transaction });
//
//       await queryInterface.createTable('orders', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
//         user_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'users', key: 'id' }
//         },
//         status_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'statuses', key: 'id' }
//         },
//         order_date: { type: Sequelize.DATE },
//         total_amount: { type: Sequelize.DECIMAL(8,2), allowNull: false },
//         delivery_method: { type: Sequelize.STRING(255), allowNull: false },
//         delivery_address: { type: Sequelize.TEXT, allowNull: false },
//         tracking_number: { type: Sequelize.STRING(255), allowNull: false },
//         delivery_cost: { type: Sequelize.DECIMAL(8,2), allowNull: false }
//       }, { transaction });
//
//       await queryInterface.createTable('product_variations', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         product_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'products', key: 'id' }
//         },
//         sku: { type: Sequelize.STRING(255), allowNull: false, unique: true },
//         price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
//         stock_quantity: { type: Sequelize.BIGINT, allowNull: false }
//       }, { transaction });
//
//       // Связующие таблицы
//       await queryInterface.createTable('product_discounts', {
//         product_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'products', key: 'id' }
//         },
//         discount_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'discounts', key: 'id' }
//         }
//       }, { transaction });
//
//       await queryInterface.createTable('variation_attributes', {
//         variation_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'product_variations', key: 'id' }
//         },
//         value_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'attribute_values', key: 'id' }
//         }
//       }, { transaction });
//
//       await queryInterface.createTable('collection_products', {
//         collection_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'collections', key: 'id' }
//         },
//         product_id: {
//           type: Sequelize.BIGINT,
//           primaryKey: true,
//           references: { model: 'products', key: 'id' }
//         }
//       }, { transaction });
//
//       // Пользовательские данные
//       await queryInterface.createTable('cart', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         user_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'users', key: 'id' }
//         },
//         product_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'products', key: 'id' }
//         },
//         variation_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'product_variations', key: 'id' }
//         },
//         quantity: { type: Sequelize.BIGINT, allowNull: false },
//         added_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
//         price_at_add: { type: Sequelize.DECIMAL(8,2), allowNull: false },
//         discount_at_add: { type: Sequelize.DECIMAL(8,2), allowNull: false },
//         attributes: { type: Sequelize.JSON, allowNull: false }
//       }, { transaction });
//
//       await queryInterface.createTable('wishlist', {
//         id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
//         user_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'users', key: 'id' }
//         },
//         product_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'products', key: 'id' }
//         },
//         variation_id: {
//           type: Sequelize.BIGINT,
//           allowNull: false,
//           references: { model: 'product_variations', key: 'id' }
//         },
//         added_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') }
//       }, { transaction });
//     });
  },
//
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // await queryInterface.dropTable('wishlist', { transaction });
      // await queryInterface.dropTable('cart', { transaction });
      // await queryInterface.dropTable('collection_products', { transaction });
      // await queryInterface.dropTable('variation_attributes', { transaction });
      // await queryInterface.dropTable('product_discounts', { transaction });
      // await queryInterface.dropTable('product_variations', { transaction });
      // await queryInterface.dropTable('attribute_values', { transaction });
      // await queryInterface.dropTable('orders', { transaction });
      // await queryInterface.dropTable('products', { transaction });
      // await queryInterface.dropTable('collections', { transaction });
      // await queryInterface.dropTable('discounts', { transaction });
      // await queryInterface.dropTable('attributes', { transaction });
      // await queryInterface.dropTable('categories', { transaction });
      // await queryInterface.dropTable('statuses', { transaction });
      await queryInterface.dropAllTables()
    });
  }
};