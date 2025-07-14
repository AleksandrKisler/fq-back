require('dotenv').config();
const { Sequelize } = require('sequelize');

// Проверка обязательных переменных
const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});

// Явное указание диалекта - КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
const dialect = 'postgres'; // Явно указываем диалект

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: dialect, // Используем явно указанный диалект
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            freezeTableName: true
        }
    }
);

// Тестовое подключение
sequelize.authenticate()
    .then(() => console.log('✅ Database connection established'))
    .catch(err => console.error('❌ Database connection error:', err));

module.exports = sequelize;