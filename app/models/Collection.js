module.exports = (sequelize, DataTypes) => {
    const Collection = sequelize.define('Collection', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        is_active: DataTypes.BOOLEAN
    }, {
        tableName: 'collections',
        timestamps: false
    });

    Collection.associate = models => {
        Collection.belongsToMany(models.Product, {
            through: models.CollectionProduct,
            foreignKey: 'collection_id'
        });
    };
    return Collection;
};