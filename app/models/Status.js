module.exports = (sequelize, DataTypes) => {
    const Status = sequelize.define('Status', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING
    }, {
        tableName: 'statuses',
        timestamps: false
    });

    Status.associate = models => {
        Status.hasMany(models.Order, { foreignKey: 'status_id' });
    };
    return Status;
};