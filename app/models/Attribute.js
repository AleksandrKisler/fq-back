module.exports = (sequelize, DataTypes) => {
    const Attribute = sequelize.define('Attribute', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, unique: true }
    }, {
        tableName: 'attributes',
        timestamps: false
    });

    Attribute.associate = models => {
        Attribute.hasMany(models.AttributeValue, {
            foreignKey: 'attribute_id',
            as: 'values'
        });
    };
    return Attribute;
};