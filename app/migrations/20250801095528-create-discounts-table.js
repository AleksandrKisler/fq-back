'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discounts', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: { type: Sequelize.ENUM('percent', 'fixed'), allowNull: false },
      value: { type: Sequelize.DECIMAL(8,2), allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      max_users: { type: Sequelize.BIGINT, allowNull: false },
      min_order_amount: { type: Sequelize.DECIMAL(8,2), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('discounts');
  }
};