'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      sku: { type: Sequelize.STRING(255), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      category_id: {
        type: Sequelize.BIGINT,
        references: { model: 'categories', key: 'id' }
      },
      description: { type: Sequelize.TEXT, allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    },);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
