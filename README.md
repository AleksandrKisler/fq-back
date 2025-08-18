превый запуск проекта

1. docker-compose -up --build
2. docker exec -it bush <node-app-name>
3. npx sequelize-cli db:migrate:all 
4. npx sequlize-cli db:seed:all


local .env api_url = http://localhost:80
