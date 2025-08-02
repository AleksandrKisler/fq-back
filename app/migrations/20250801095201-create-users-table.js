module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(100), allowNull: false },
        birthday: { type: Sequelize.DATEONLY, allowNull: true },
        email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        phone: { type: Sequelize.STRING(15), allowNull: true, unique: true },
        is_confirmed: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        password: { type: Sequelize.STRING(150), allowNull: false },
        email_verification_token: { type: Sequelize.STRING(150), allowNull: true },
        email_verification_token_expires: { type: Sequelize.STRING(150), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};