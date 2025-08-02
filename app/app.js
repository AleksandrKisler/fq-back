const express = require('express');
const sequelize = require('./config');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());

// Проверка подключения к БД
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        database: sequelize.config.database,
        host: sequelize.config.host,
        dialect: sequelize.getDialect() // Явное получение диалекта
    });
});


// Подключение роутов
app.use('/api/v1/', authRoutes);
app.use('/api/v1/', productRoutes);

// Функция запуска миграций
async function runMigrations() {
    // return new Promise((resolve, reject) => {
    //     exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    //         if (error) {
    //             console.error('❌ Migration error:', error.message);
    //             console.error('Migration stderr:', stderr);
    //             reject(error);
    //             return;
    //         }
    //         console.log('✅ Migrations executed successfully');
    //         console.log(stdout);
    //         resolve();
    //     });
    // });
}

// Главная функция запуска
async function startServer() {
    try {
        // Проверяем и выводим используемый диалект
        console.log(`Using dialect: ${sequelize.getDialect()}`);

        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Запуск миграций
        if (process.env.RUN_MIGRATIONS === 'true') {
            console.log('🚀 Running database migrations...');
            await runMigrations();
        }

        // Запуск сервера
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: ${sequelize.config.database}@${sequelize.config.host}`);
            console.log(`Dialect: ${sequelize.getDialect()}`); // Явный вывод диалекта
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Запускаем сервер
startServer();