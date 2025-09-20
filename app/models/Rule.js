'use strict';
module.exports = (sequelize, DataTypes) => {
  const Rule = sequelize.define('Rule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { len: [1, 255] },
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      defaultValue: '',
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'rules',
    underscored: true,
  });

  return Rule;
};
