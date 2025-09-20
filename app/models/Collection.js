// app/models/collection.js
module.exports = (sequelize, DataTypes) => {
  const Collection = sequelize.define('Collection', {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    preview_image: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'collections',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Collection.associate = (models) => {
    Collection.belongsToMany(models.Product, {
      through: 'collection_products',
      foreignKey: 'collection_id',
      otherKey: 'product_id',
      as: 'products'
    });
  };

  return Collection;
};
