// models/article.js
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Article', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        excerpt: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        content: {  // Основное поле для HTML из Vue-Quill
            type: DataTypes.TEXT,
            allowNull: false
        },
        main_image: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        publish_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        // Дополнительные поля для SEO
        meta_title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        meta_description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        deleted_at: {  // Добавляем поле для мягкого удаления
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        hooks: {
            beforeUpdate: (article) => {
                article.updated_at = new Date();
            },
        },
        tableName: 'articles'
    });
};