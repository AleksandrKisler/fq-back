'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('banners', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      type: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      source_id: { type: Sequelize.TEXT, allowNull: true },
      image_position: { type: Sequelize.STRING(255), allowNull: true },
      image_url: { type: Sequelize.STRING(255), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('banners');

  }
};
