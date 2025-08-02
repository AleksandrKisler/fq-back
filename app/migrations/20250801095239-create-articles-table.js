'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('articles', {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        excerpt: { type: Sequelize.TEXT, allowNull: true },
        content: { type: Sequelize.TEXT, allowNull: false },
        main_image: { type: Sequelize.STRING(500), allowNull: true },
        publish_date: { type: Sequelize.DATEONLY, allowNull: false },
        meta_title: { type: Sequelize.STRING(255), allowNull: true },
        meta_description: { type: Sequelize.TEXT, allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });
      await queryInterface.addIndex('articles', ['slug'], { unique: true, transaction });
      await queryInterface.addIndex('articles', ['is_active'], { transaction });
      await queryInterface.addIndex('articles', ['deleted_at'], { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('articles');
  }
};