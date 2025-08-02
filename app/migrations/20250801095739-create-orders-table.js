'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      slug: { type: Sequelize.STRING(255), unique: true },
      user_id: {
        type: Sequelize.BIGINT,
        references: { model: 'users', key: 'id' }
      },
      status_id: {
        type: Sequelize.BIGINT,
        references: { model: 'statuses', key: 'id' }
      },
      order_date: { type: Sequelize.DATE },
      total_amount: { type: Sequelize.DECIMAL(8,2), allowNull: false },
      delivery_method: { type: Sequelize.STRING(255), allowNull: false },
      delivery_address: { type: Sequelize.TEXT, allowNull: false },
      tracking_number: { type: Sequelize.STRING(255), allowNull: false },
      delivery_cost: { type: Sequelize.DECIMAL(8,2), allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  }
};