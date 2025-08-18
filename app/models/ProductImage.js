module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define('ProductImage', {
    sort_order: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    tableName: 'product_images',
    underscored: true,
    freezeTableName: true
  });

  ProductImage.removeAttribute('id');

  ProductImage.associate = function(models) {
    ProductImage.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
    ProductImage.belongsTo(models.Image, {
      foreignKey: 'image_id',
      as: 'image',
      tableName: 'images'
    });
  };

  return ProductImage;
};
