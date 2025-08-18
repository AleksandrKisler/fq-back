'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      image_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'images',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      sort_order: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('product_images', {
      fields: ['product_id', 'image_id'],
      type: 'primary key',
      name: 'product_images_pkey'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  }
};
