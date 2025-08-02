module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        quantity: DataTypes.BIGINT,
        added_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        price_at_add: DataTypes.DECIMAL(8,2),
        discount_at_add: DataTypes.DECIMAL(8,2),
        attributes: DataTypes.JSON
    }, {
        tableName: 'cart',
        timestamps: false
    });

    Cart.associate = models => {
        Cart.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });

        Cart.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product'
        });

        Cart.belongsTo(models.ProductVariation, {
            foreignKey: 'variation_id',
            as: 'variation'
        });
    };
    return Cart;
};