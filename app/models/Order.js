module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING, unique: true },
        order_date: DataTypes.DATE,
        total_amount: DataTypes.DECIMAL(10,2),
        subtotal_amount: DataTypes.DECIMAL(10,2),
        total_discount: DataTypes.DECIMAL(10,2),
        delivery_method: DataTypes.STRING,
        delivery_address: DataTypes.TEXT,
        tracking_number: DataTypes.STRING,
        delivery_cost: DataTypes.DECIMAL(10,2),
        customer_email: DataTypes.STRING,
        customer_phone: DataTypes.STRING,
        customer_name: DataTypes.STRING,
        comment: DataTypes.TEXT,
        payment_id: DataTypes.STRING,
        payment_status: DataTypes.STRING,
        payment_method: DataTypes.STRING,
        payment_confirmation_url: DataTypes.STRING,
        payment_data: DataTypes.JSONB,
        currency: DataTypes.STRING,
        metadata: DataTypes.JSONB,
        paid_at: DataTypes.DATE,
        cancellation_reason: DataTypes.STRING
    }, {
        tableName: 'orders',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Order.associate = models => {
        Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Order.belongsTo(models.Status, { foreignKey: 'status_id', as: 'status' });
        Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
    };
    return Order;
};