module.exports = (sequelize, DataTypes) => {
    const ProductDiscount = sequelize.define('ProductDiscount', {
        product_id: { type: DataTypes.BIGINT, primaryKey: true },
        discount_id: { type: DataTypes.BIGINT, primaryKey: true }
    }, {
        tableName: 'product_discounts',
        timestamps: false
    });

    ProductDiscount.associate = models => {
        ProductDiscount.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'products'
        });
        ProductDiscount.belongsTo(models.Discount, {
            foreignKey: 'discount_id',
            as: 'discounts'
        });
    };
    return ProductDiscount;
};