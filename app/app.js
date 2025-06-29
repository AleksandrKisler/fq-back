const express = require('express');
// const { sequelize } = require('./models');
// const routes = require('./routes');

const app = express();
app.use(express.json());

// Подключение роутов
// app.use('/', );

// Обработка ошибок
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});



app.get('/hello', (req, res) => {
    res.send('Hello World!');
})

// Подключение к БД и запуск сервера
// sequelize.sync().then(() => {
    app.listen(3000, () => console.log('Server started on port 3000'));
// });