'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('variation_attributes', {
      variation_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'product_variations', key: 'id' }
      },
      value_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        references: { model: 'attribute_values', key: 'id' }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('variation_attributes');
  }
};