module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define('Wishlist', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    added_at: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
  }, {
    tableName: 'wishlist',
    timestamps: false,
  });

  Wishlist.associate = models => {
    Wishlist.belongsTo(models.User, {foreignKey: 'user_id', as: 'user'});
    Wishlist.belongsTo(models.Product, {foreignKey: 'product_id', as: 'product'});
    Wishlist.belongsTo(models.ProductVariation, {foreignKey: 'variation_id', as: 'variation'});
  };
  return Wishlist;
};
