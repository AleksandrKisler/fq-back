'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [parentCategory] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE slug = 'root-shoes'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let parentId;
    if (!parentCategory) {
      const [newParent] = await queryInterface.bulkInsert('categories', [
        {
          title: 'Обувь',
          slug: 'root-shoes',
          parent_id: null,
        }
      ], { returning: true });

      parentId = newParent.id;
    } else {
      parentId = parentCategory.id;
    }

    await queryInterface.sequelize.query(`
      UPDATE categories
      SET parent_id = :parentId
    `, {
      replacements: {
        parentId,
      }
    });
  },

  down: (queryInterface, Sequelize) => {
  }
};
