// app/models/homePage.js
module.exports = (sequelize, DataTypes) => {
  const HomePage = sequelize.define('HomePage', {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    slug:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
    is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at:{ type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'home_pages',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  HomePage.associate = (models) => {
    HomePage.hasMany(models.HomeBannerSlot,    { foreignKey: 'page_id', as: 'bannerSlots' });
    HomePage.hasMany(models.HomeSelectionSlot, { foreignKey: 'page_id', as: 'selectionSlots' });
  };

  return HomePage;
};
