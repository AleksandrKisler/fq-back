module.exports = (sequelize, DataTypes) => {
    const VariationAttribute = sequelize.define('VariationAttribute', {
        variation_id: { type: DataTypes.BIGINT, primaryKey: true },
        value_id: { type: DataTypes.BIGINT, primaryKey: true }
    }, {
        tableName: 'variation_attributes',
        timestamps: false
    });

    // Добавьте ассоциации если нужно
    VariationAttribute.associate = models => {
        VariationAttribute.belongsTo(models.ProductVariation, {
            foreignKey: 'variation_id',
            as: 'productVariation'
        });
        VariationAttribute.belongsTo(models.AttributeValue, {
            foreignKey: 'value_id',
            as: 'attributeValues'
        });
    };

    return VariationAttribute;
};