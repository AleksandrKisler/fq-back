module.exports = (sequelize, DataTypes) => {
    const CollectionProduct = sequelize.define('CollectionProduct', {
        collection_id: { type: DataTypes.BIGINT, primaryKey: true },
        product_id: { type: DataTypes.BIGINT, primaryKey: true }
    }, {
        tableName: 'collection_products',
        timestamps: false
    });
    return CollectionProduct;
};