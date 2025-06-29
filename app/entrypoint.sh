#!/bin/sh

# Установка зависимостей для не-production сред
if [ "$NODE_ENV" != "production" ]; then
    npm install
fi

# Выбор команды запуска
if [ "$NODE_ENV" = "production" ]; then
    echo "Running development server"
    exec npm start
else
    echo "Running development server"
    exec npm run dev
fi