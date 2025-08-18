// app/models/collectionProduct.js
module.exports = (sequelize, DataTypes) => {
  const CollectionProduct = sequelize.define('CollectionProduct', {
    collection_id: { type: DataTypes.BIGINT, primaryKey: true },
    product_id:    { type: DataTypes.BIGINT, primaryKey: true },
  }, {
    tableName: 'collection_products',
    timestamps: false,
    underscored: true
  });

  // в таблице нет auto id
  CollectionProduct.removeAttribute('id');

  CollectionProduct.associate = (models) => {
    CollectionProduct.belongsTo(models.Collection, { foreignKey: 'collection_id', as: 'collection' });
    CollectionProduct.belongsTo(models.Product,    { foreignKey: 'product_id',    as: 'product'    });
  };

  return CollectionProduct;
};
