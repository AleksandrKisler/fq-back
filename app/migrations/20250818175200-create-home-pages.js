// app/migrations/XXXX-create-home-pages.js
'use strict';

module.exports = {
  async up (qi, Sequelize) {
    await qi.createTable('home_pages', {
      id:          { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      title:       { type: Sequelize.STRING(255), allowNull: false },
      slug:        { type: Sequelize.STRING(255), allowNull: false, unique: true },
      is_active:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      published_at:{ type: Sequelize.DATE, allowNull: true },

      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at:  { type: Sequelize.DATE, allowNull: true }
    });

    // Разрешаем только одну активную запись
    // (PostgreSQL partial unique index)
    await qi.sequelize.query(`
      CREATE UNIQUE INDEX home_pages_one_active_idx
      ON home_pages (is_active)
      WHERE is_active = true AND deleted_at IS NULL;
    `);
  },

  async down (qi) {
    await qi.sequelize.query(`DROP INDEX IF EXISTS home_pages_one_active_idx;`);
    await qi.dropTable('home_pages');
  }
};
