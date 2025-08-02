'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.BIGINT,
        references: { model: 'users', key: 'id' }
      },
      product_id: {
        type: Sequelize.BIGINT,
        references: { model: 'products', key: 'id' }
      },
      variation_id: {
        type: Sequelize.BIGINT,
        references: { model: 'product_variations', key: 'id' }
      },
      quantity: { type: Sequelize.BIGINT, allowNull: false },
      added_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      price_at_add: { type: Sequelize.DECIMAL(8,2), allowNull: false },
      discount_at_add: { type: Sequelize.DECIMAL(8,2), allowNull: false },
      attributes: { type: Sequelize.JSON, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('cart');
  }
};