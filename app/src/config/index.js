require('dotenv').config();
const {Sequelize} = require('sequelize');

module.exports = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
        ssl: false,
        auth: {
            authMethod: 'password'
        }
    },
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true, // Используем snake_case вместо camelCase
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
