// app/migrations/XXXX-create-home-banner-slots.js
'use strict';

module.exports = {
  async up (qi, Sequelize) {
    await qi.createTable('home_banner_slots', {
      id:        { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      page_id:   { type: Sequelize.BIGINT, allowNull: false, references: { model: 'home_pages', key: 'id' }, onDelete: 'CASCADE' },
      slot:      { type: Sequelize.STRING(16), allowNull: false }, // 'main','slot-1','slot-2','slot-3'
      banner_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'banners', key: 'id' }, onDelete: 'CASCADE' },

      created_at:{ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:{ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addConstraint('home_banner_slots', {
      fields: ['slot'],
      type: 'check',
      name: 'home_banner_slots_slot_chk',
      where: { slot: ['main','slot-1','slot-2','slot-3'] }
    });
    await qi.addConstraint('home_banner_slots', {
      fields: ['page_id','slot'],
      type: 'unique',
      name: 'home_banner_slots_page_slot_uq'
    });
  },

  async down (qi) {
    await qi.dropTable('home_banner_slots');
  }
};
