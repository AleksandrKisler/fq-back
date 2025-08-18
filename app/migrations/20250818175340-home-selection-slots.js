// app/migrations/XXXX-create-home-selection-slots.js
'use strict';

module.exports = {
  async up (qi, Sequelize) {
    await qi.createTable('home_selection_slots', {
      id:           { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      page_id:      { type: Sequelize.BIGINT, allowNull: false, references: { model: 'home_pages', key: 'id' }, onDelete: 'CASCADE' },
      slot:         { type: Sequelize.STRING(16), allowNull: false }, // 'slot-1','slot-2','slot-3'
      selection_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'selections', key: 'id' }, onDelete: 'CASCADE' },

      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addConstraint('home_selection_slots', {
      fields: ['slot'],
      type: 'check',
      name: 'home_selection_slots_slot_chk',
      where: { slot: ['slot-1','slot-2','slot-3'] }
    });
    await qi.addConstraint('home_selection_slots', {
      fields: ['page_id','slot'],
      type: 'unique',
      name: 'home_selection_slots_page_slot_uq'
    });
  },

  async down (qi) {
    await qi.dropTable('home_selection_slots');
  }
};
