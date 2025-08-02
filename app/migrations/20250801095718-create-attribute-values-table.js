'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attribute_values', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      attribute_id: {
        type: Sequelize.BIGINT,
        references: { model: 'attributes', key: 'id' }
      },
      value: { type: Sequelize.STRING(255), allowNull: false },
      hex_code: { type: Sequelize.STRING(255) }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('attribute_values');
  }
};