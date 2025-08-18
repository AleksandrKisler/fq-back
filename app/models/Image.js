module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define('Image', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    file_path: DataTypes.STRING,
    file_url: DataTypes.STRING,
    file_size: DataTypes.BIGINT,
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    tableName: 'images'
  });

  Image.associate = function (models) {
    Image.belongsToMany(models.Product, {
      through: 'product_images',
      foreignKey: 'image_id',
      as: 'products'
    });
  };

  return Image;
};
