'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('statuses', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(255), allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('statuses');
  }
};