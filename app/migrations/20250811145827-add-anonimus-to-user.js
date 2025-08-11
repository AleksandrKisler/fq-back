'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'device_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    })
    await queryInterface.addColumn('users', 'is_anonymous', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    })
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('users', 'device_id');
    await queryInterface.removeColumn('users', 'is_anonymous');
  }
};

