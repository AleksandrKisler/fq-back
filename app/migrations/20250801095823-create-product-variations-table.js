'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variations', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      product_id: {
        type: Sequelize.BIGINT,
        references: { model: 'products', key: 'id' }
      },
      sku: { type: Sequelize.STRING(255), unique: true },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      stock_quantity: { type: Sequelize.BIGINT, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_variations');
  }
};