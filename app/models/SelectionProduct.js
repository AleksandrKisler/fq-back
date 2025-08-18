// app/models/selectionProduct.js
module.exports = (sequelize, DataTypes) => {
  const SelectionProduct = sequelize.define('SelectionProduct', {
    collection_id: { type: DataTypes.BIGINT, primaryKey: true },
    product_id:    { type: DataTypes.BIGINT, primaryKey: true },
  }, {
    tableName: 'selection_products',
    timestamps: false,
    underscored: true
  });

  // ВАЖНО: у таблицы нет auto id
  SelectionProduct.removeAttribute('id');

  SelectionProduct.associate = (models) => {
    SelectionProduct.belongsTo(models.Selection, { foreignKey: 'collection_id', as: 'selection' });
    SelectionProduct.belongsTo(models.Product,   { foreignKey: 'product_id',    as: 'product'   });
  };

  return SelectionProduct;
};
