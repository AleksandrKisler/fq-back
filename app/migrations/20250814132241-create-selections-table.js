'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('selections', {
      id: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
      title: {type: Sequelize.STRING(255), allowNull: false},
      slug: {type: Sequelize.STRING(255), allowNull: false, unique: true},
      description: {type: Sequelize.TEXT, allowNull: false},
      is_active: {type: Sequelize.BOOLEAN, allowNull: false},
      created_at: {type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')},
      updated_at: {type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')},
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('selections');
  }
};
