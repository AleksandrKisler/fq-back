module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING,
        slug: { type: DataTypes.STRING, unique: true }
    }, {
        tableName: 'categories',
        timestamps: false
    });

    Category.associate = models => {
        Category.hasMany(models.Product, { foreignKey: 'category_id' });
    };
    return Category;
};