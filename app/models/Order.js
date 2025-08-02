module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING, unique: true },
        order_date: DataTypes.DATE,
        total_amount: DataTypes.DECIMAL(10,2),
        delivery_method: DataTypes.STRING,
        delivery_address: DataTypes.TEXT,
        tracking_number: DataTypes.STRING,
        delivery_cost: DataTypes.DECIMAL(10,2)
    }, {
        tableName: 'orders',
        timestamps: false
    });

    Order.associate = models => {
        Order.belongsTo(models.User, { foreignKey: 'user_id' });
        Order.belongsTo(models.Status, { foreignKey: 'status_id' });
    };
    return Order;
};