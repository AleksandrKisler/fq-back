module.exports = (sequelize, DataTypes) => {
  const HomeBannerSlot = sequelize.define('HomeBannerSlot', {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    page_id:   { type: DataTypes.BIGINT, allowNull: false },
    slot:      { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [['main','slot-1','slot-2','slot-3']] } },
    banner_id: { type: DataTypes.BIGINT, allowNull: false }
  }, {
    tableName: 'home_banner_slots',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  HomeBannerSlot.associate = (models) => {
    HomeBannerSlot.belongsTo(models.HomePage, { foreignKey: 'page_id', as: 'page' });
    HomeBannerSlot.belongsTo(models.Banner,   { foreignKey: 'banner_id', as: 'banner' });
  };

  return HomeBannerSlot;
};
