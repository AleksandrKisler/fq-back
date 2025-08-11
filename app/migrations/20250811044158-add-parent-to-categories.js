module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'parent_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('categories', 'parent_id');
  }
};
