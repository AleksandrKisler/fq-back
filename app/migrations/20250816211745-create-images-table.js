'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('images', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      file_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '/public/images/'
      },
      file_url: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('images');
  }
};
