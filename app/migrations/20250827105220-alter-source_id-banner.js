'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('banners', 'source_id', 'source' );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('banners', 'source', 'source_id' );
  }
};
