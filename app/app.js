const express = require('express');
const sequelize = require('./config');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const articleRoutes = require('./routes/articleRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const selectionRoutes = require('./routes/selectionRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const homePageRoutes = require('./routes/homePageRoutes');
const aboutPageRoutes = require('./routes/aboutPageRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const uploadsRouter = require('./routes/uploads');
const rulesRouter = require('./routes/rulesRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const cors = require('cors')
const path = require('path');


const app = express();
app.use(express.json());

app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
app.use('/product', express.static(path.join(process.cwd(), 'public', 'product')));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true // если нужно разрешить передачу кук
}));

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
app.use('/api/v1/', cartRoutes);
app.use('/api/v1/', wishlistRoutes);
app.use('/api/v1/', articleRoutes);
app.use('/api/v1/', bannerRoutes);
app.use('/api/v1/', selectionRoutes);
app.use('/api/v1/', collectionRoutes);
app.use('/api/v1/', homePageRoutes);
app.use('/api/v1/', aboutPageRoutes);
app.use('/api/v1/', orderRoutes);
app.use('/api/v1/', deliveryRoutes);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/rules', rulesRouter);
app.use('/api/v1/newsletter', authMiddleware, adminMiddleware, newsletterRoutes);

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
        const PORT = process.env.PORT || 3001;
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
