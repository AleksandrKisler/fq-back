// app/models/banner.js
module.exports = (sequelize, DataTypes) => {
  const TYPE_VALUES = ['PRODUCT', 'COLLECTION', 'INFORMATION', 'MAIN'];
  const IMG_POS_VALUES = ['DEFAULT', 'LEFT', 'RIGHT'];

  const Banner = sequelize.define('Banner', {
    id: {type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true},
    type: {type: DataTypes.STRING, allowNull: false, validate: {isIn: [TYPE_VALUES]}},
    title: {type: DataTypes.STRING(255), allowNull: false},
    description: {type: DataTypes.TEXT, allowNull: false},
    source: {type: DataTypes.TEXT, allowNull: true},
    image_position: {type: DataTypes.STRING(255), allowNull: true, validate: {isIn: [IMG_POS_VALUES]}},
    image_url: {type: DataTypes.STRING(255), allowNull: false},
    is_active: {type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false},
    text_color: {type: DataTypes.STRING(255), allowNull: true, defaultValue: '#000'},
  }, {
    tableName: 'banners',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  Banner.TYPE_VALUES = TYPE_VALUES;
  Banner.IMG_POS_VALUES = IMG_POS_VALUES;

  return Banner;
};
