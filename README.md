превый запуск проекта

1. docker-compose -up --build
2. docker exec -it bush <node-app-name>
3. npx sequelize-cli db:migrate:all 
4. npx sequlize-cli db:seed:all


local .env api_url = http://localhost:80

## Рассылка новостей

### POST `/api/v1/newsletter/send`

- **Заголовки**: `Authorization: Bearer <JWT>` — требуется подтверждённый администратор.
- **Параметры тела запроса**:
  - `subject` (string, обязательно) — тема письма.
  - `template` (string, обязательно) — HTML/текст шаблона письма.
  - `criteria` (object, необязательно) — дополнительные параметры выборки, которые будут объединены с условием `isConfirmed: true`.

### Ответ

```json
{
  "message": "Рассылка успешно отправлена",
  "summary": {
    "total": 25,
    "sent": 25,
    "failed": 0
  },
  "failures": []
}
```

При частичных ошибках поле `failures` будет содержать список адресов с описанием причины.
