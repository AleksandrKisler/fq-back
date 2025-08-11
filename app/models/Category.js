module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    title: DataTypes.STRING,
    slug: {type: DataTypes.STRING, unique: true},
    parent_id: { // Добавьте это поле для иерархии
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'categories',
    timestamps: false
  });

  Category.associate = models => {
    Category.hasMany(models.Product, {foreignKey: 'category_id'});
    // Добавьте связи для иерархии
    Category.hasMany(Category, {
      as: 'children',
      foreignKey: 'parent_id'
    });
    Category.belongsTo(Category, {
      as: 'parent',
      foreignKey: 'parent_id'
    });
  };
  return Category;
};
