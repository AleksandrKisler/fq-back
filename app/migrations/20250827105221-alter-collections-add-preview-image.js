'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1) добавить превью
    await queryInterface.addColumn('collections', 'preview_image', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

  },

  async down (queryInterface, Sequelize) {

    // убрать превью
    await queryInterface.removeColumn('collections', 'preview_image');
  }
};
