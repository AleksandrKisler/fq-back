module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('about_pages', {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        published_at: { type: Sequelize.DATE, allowNull: true },
        blocks: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('about_pages');
  },
};
