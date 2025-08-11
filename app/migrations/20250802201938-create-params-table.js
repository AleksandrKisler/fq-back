'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('params', {
      id: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement:true},
      product_id: {type: Sequelize.BIGINT, references: { model: 'products', key: 'id' }},
      title: {type: Sequelize.STRING(255), allowNull: false},
      value: {type: Sequelize.STRING(255), allowNull: false},
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })
  },

  async down (queryInterface) {
    await queryInterface.dropTable('params');
  }
};
