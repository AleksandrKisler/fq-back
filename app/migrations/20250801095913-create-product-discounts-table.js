'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_discounts', {
      product_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'products', key: 'id' }
      },
      discount_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'discounts', key: 'id' }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_discounts');
  }
};