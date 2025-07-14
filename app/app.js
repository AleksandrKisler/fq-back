const express = require('express');

const db = require('./src/models');
// const routes = require('./routes');

const app = express();
app.use(express.json());



// Обработка ошибок
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

app.get('/hello', (req, res) => {
    res.send('Hello World!');
})

async function testConnection() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Подключение к БД успешно установлено');

        // Синхронизация моделей с БД (только для разработки!)
        // await db.sequelize.sync({ alter: true });
        // console.log('🔄 Модели синхронизированы');

    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error);
    }
}

testConnection().then(() => {
    app.listen(3000, () => console.log('Server started on port 3000'));
})

