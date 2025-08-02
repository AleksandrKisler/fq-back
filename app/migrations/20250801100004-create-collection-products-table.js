'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('collection_products', {
      collection_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'collections', key: 'id' }
      },
      product_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'products', key: 'id' }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('collection_products');
  }
};