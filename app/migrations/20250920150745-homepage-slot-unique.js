// migrations/20250920-homepage-slot-unique.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('home_banner_slots', {
      fields: ['page_id','slot'],
      type: 'unique',
      name: 'uniq_home_banner_slots_page_slot',
    });
    await queryInterface.addConstraint('home_selection_slots', {
      fields: ['page_id','slot'],
      type: 'unique',
      name: 'uniq_home_selection_slots_page_slot',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeConstraint('home_banner_slots', 'uniq_home_banner_slots_page_slot');
    await queryInterface.removeConstraint('home_selection_slots', 'uniq_home_selection_slots_page_slot');
  }
};
