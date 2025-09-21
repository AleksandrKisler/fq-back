module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    order_id: {type: DataTypes.BIGINT, allowNull: false},
    product_id: {type: DataTypes.BIGINT, allowNull: true},
    product_title: {type: DataTypes.STRING},
    variation_id: {type: DataTypes.BIGINT, allowNull: true},
    variation_sku: {type: DataTypes.STRING},
    quantity: {type: DataTypes.INTEGER, allowNull: false},
    unit_price: {type: DataTypes.DECIMAL(10, 2), allowNull: false},
    discount: {type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0},
    total_price: {type: DataTypes.DECIMAL(10, 2), allowNull: false},
    attributes: {type: DataTypes.JSONB, allowNull: true}
  }, {
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  OrderItem.associate = models => {
    OrderItem.belongsTo(models.Order, {foreignKey: 'order_id', as: 'order'});
    OrderItem.belongsTo(models.Product, {foreignKey: 'product_id', as: 'product'});
    OrderItem.belongsTo(models.ProductVariation, {foreignKey: 'variation_id', as: 'variation'});
  };

  return OrderItem;
};
