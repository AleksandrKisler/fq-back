module.exports = (sequelize, DataTypes) => {
  const ProductParams = sequelize.define('ProductParams', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.BIGINT, primaryKey: true },
    title: DataTypes.STRING,
    value: DataTypes.STRING,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }, {
    tableName: 'params',
    timestamps: false,
    hooks: {
      beforeUpdate(product) {
        product.updated_at = new Date();
      },
      beforeCreate(product) {
        product.updated_at = new Date();
      },
    },
  });

  ProductParams.associate = models => {
    ProductParams.belongsTo(models.Product, {
      foreignKey: 'id',
      as: 'product'
    });
  };

  return ProductParams;
};