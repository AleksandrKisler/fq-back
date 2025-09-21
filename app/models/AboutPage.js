const { validateBlocks, BLOCK_TYPES } = require('../utils/aboutPageBlocks');

module.exports = (sequelize, DataTypes) => {
  const AboutPage = sequelize.define('AboutPage', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at: { type: DataTypes.DATE, allowNull: true },
    blocks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidBlocks(value) {
          const errors = validateBlocks(value);
          if (errors.length) {
            const error = new Error(errors.join('; '));
            error.name = 'ValidationError';
            throw error;
          }
        },
      },
    },
  }, {
    tableName: 'about_pages',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  AboutPage.BLOCK_TYPES = BLOCK_TYPES;

  return AboutPage;
};
