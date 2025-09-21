'use strict';

const statuses = [
  'Создан',
  'Ожидает оплаты',
  'Ожидает подтверждения',
  'Оплачен',
  'Отменен'
];

module.exports = {
  async up(queryInterface) {
    for (const title of statuses) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(
        `INSERT INTO statuses (title) SELECT :title WHERE NOT EXISTS (SELECT 1 FROM statuses WHERE title = :title)`,
        {replacements: {title}}
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('statuses', {title: statuses});
  }
};
