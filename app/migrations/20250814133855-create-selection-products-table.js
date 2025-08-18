'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('selection_products', {
      collection_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'selections', key: 'id' }
      },
      product_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'products', key: 'id' }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('selection_products');
  }
};
