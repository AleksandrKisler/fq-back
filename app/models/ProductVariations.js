module.exports = (sequelize, DataTypes) => {
    const ProductVariation = sequelize.define('ProductVariation', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.BIGINT, allowNull: false },
        sku: { type: DataTypes.STRING, unique: true },
        stock_quantity: DataTypes.BIGINT
    }, {
        tableName: 'product_variations',
        timestamps: false
    });

    ProductVariation.associate = models => {
        ProductVariation.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product'
        });

        // Исправленная ассоциация
        ProductVariation.belongsToMany(models.AttributeValue, {
            through: models.VariationAttribute,
            foreignKey: 'variation_id',
            as: 'attributes'
        });

        ProductVariation.hasMany(models.Cart, {
            foreignKey: 'variation_id',
            as: 'carts'
        });

        ProductVariation.hasMany(models.Wishlist, {
            foreignKey: 'variation_id',
            as: 'wishlists'
        });
    };

    return ProductVariation;
};
