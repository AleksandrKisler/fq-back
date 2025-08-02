'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wishlist', {
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
      added_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('wishlist');
  }
};