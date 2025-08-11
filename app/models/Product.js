const bcrypt = require("bcrypt");
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    sku: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    slug: {type: DataTypes.STRING, unique: true},
    price: DataTypes.DECIMAL(10, 2),
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate(product) {
        product.updated_at = new Date();
      },
      beforeCreate(product) {
        product.updated_at = new Date();
      },
    }
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });

    Product.hasMany(models.ProductVariation, {
      foreignKey: 'product_id',
      as: 'variations'
    });

    Product.hasMany(models.ProductParams, {
      foreignKey: 'product_id',
      as: 'params'
    })
    //https://ekonika.ru/catalog/view/en01077cn06chocolate25w
    //https://ekonika.ru/catalog/view/en01077cn06tomato25w

    Product.belongsToMany(models.Discount, {
      through: models.ProductDiscount,
      foreignKey: 'product_id',
      as: 'discounts'
    });

    Product.belongsToMany(models.Collection, {
      through: models.CollectionProduct,
      foreignKey: 'product_id',
      as: 'collections'
    });
  };
  return Product;
};
