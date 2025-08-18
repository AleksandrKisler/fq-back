module.exports = (sequelize, DataTypes) => {
  const HomeSelectionSlot = sequelize.define('HomeSelectionSlot', {
    id:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    page_id:      { type: DataTypes.BIGINT, allowNull: false },
    slot:         { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [['slot-1','slot-2','slot-3']] } },
    selection_id: { type: DataTypes.BIGINT, allowNull: false }
  }, {
    tableName: 'home_selection_slots',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  HomeSelectionSlot.associate = (models) => {
    HomeSelectionSlot.belongsTo(models.HomePage,   { foreignKey: 'page_id',      as: 'page' });
    HomeSelectionSlot.belongsTo(models.Selection,  { foreignKey: 'selection_id', as: 'selection' });
  };

  return HomeSelectionSlot;
};
