// app/models/selection.js
module.exports = (sequelize, DataTypes) => {
  const Selection = sequelize.define('Selection', {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    slug:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at:  { type: DataTypes.DATE },
    updated_at:  { type: DataTypes.DATE },
  }, {
    tableName: 'selections',
    underscored: true,
    timestamps: true,
  });

  Selection.associate = (models) => {
    Selection.belongsToMany(models.Product, {
      through: 'selection_products',
      foreignKey: 'collection_id',   // важно: в вашей join-таблице это имя колонки
      otherKey: 'product_id',
      as: 'products'
    });
  };

  return Selection;
};
