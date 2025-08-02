module.exports = (sequelize, DataTypes) => {
    const AttributeValue = sequelize.define('AttributeValue', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        value: DataTypes.STRING,
        hex_code: DataTypes.STRING
    }, {
        tableName: 'attribute_values',
        timestamps: false
    });

    AttributeValue.associate = models => {
        AttributeValue.belongsTo(models.Attribute, {
            foreignKey: 'attribute_id',
            as: 'attribute'
        });

        AttributeValue.belongsToMany(models.ProductVariation, {
            through: models.VariationAttribute,
            foreignKey: 'value_id',
            as: 'variations' // или 'productVariations'
        });
    };
    return AttributeValue;
};