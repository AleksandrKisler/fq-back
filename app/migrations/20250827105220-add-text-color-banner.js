'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('banners', 'text_color', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: '#000',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('banners', 'text_color');
  }
};
