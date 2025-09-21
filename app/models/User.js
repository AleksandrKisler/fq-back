const bcrypt = require("bcrypt");
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        birthday: DataTypes.DATEONLY,
        email: { type: DataTypes.STRING, unique: true },
        emailVerificationToken: { type: DataTypes.STRING, allowNull: true, field: 'email_verification_token' },
        emailVerificationTokenExpires: { type: DataTypes.DATE, allowNull: true, field: 'email_verification_token_expires' },
        isConfirmed: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        password: { type: DataTypes.STRING, allowNull: false },
        device_id: { type: DataTypes.STRING, unique: true, allowNull: true }, // Уникальный идентификатор устройства
        is_anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate(user) {
                user.updated_at = new Date();
            },
            beforeCreate(user) {
                user.updated_at = new Date();
            }
        }
    });

    User.prototype.isValidPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    };

    User.associate = models => {
        User.hasMany(models.Order, {
            foreignKey: 'user_id',
            as: 'orders'
        });

        User.hasMany(models.Cart, {
            foreignKey: 'user_id',
            as: 'carts'
        });

        User.hasMany(models.Wishlist, {
            foreignKey: 'user_id',
            as: 'wishlists'
        });
    };
    return User;
};
