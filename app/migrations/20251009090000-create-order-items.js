'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {model: 'orders', key: 'id'},
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {model: 'products', key: 'id'}
      },
      product_title: {type: Sequelize.STRING},
      variation_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {model: 'product_variations', key: 'id'}
      },
      variation_sku: {type: Sequelize.STRING},
      quantity: {type: Sequelize.INTEGER, allowNull: false},
      unit_price: {type: Sequelize.DECIMAL(10,2), allowNull: false},
      discount: {type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0},
      total_price: {type: Sequelize.DECIMAL(10,2), allowNull: false},
      attributes: {type: Sequelize.JSONB},
      created_at: {type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now')},
      updated_at: {type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now')}
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  }
};
