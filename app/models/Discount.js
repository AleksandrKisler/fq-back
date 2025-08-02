module.exports = (sequelize, DataTypes) => {
    const Discount = sequelize.define('Discount', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        type: DataTypes.ENUM('percent', 'fixed'),
        value: DataTypes.DECIMAL(8,2),
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE,
        max_users: DataTypes.BIGINT,
        min_order_amount: DataTypes.DECIMAL(8,2),
        is_active: DataTypes.BOOLEAN
    }, {
        tableName: 'discounts',
        timestamps: false
    });

    Discount.associate = models => {
        Discount.belongsToMany(models.Product, {
            through: models.ProductDiscount,
            foreignKey: 'discount_id',
            as: 'products'
        });
    };
    return Discount;
};