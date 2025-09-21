превый запуск проекта

1. docker-compose -up --build
2. docker exec -it bush <node-app-name>
3. npx sequelize-cli db:migrate:all 
4. npx sequlize-cli db:seed:all


local .env api_url = http://localhost:80

## Настройки YooKassa

Для работы онлайн-оплаты требуется добавить в `.env`:

```
YOOKASSA_SHOP_ID=<идентификатор магазина>
YOOKASSA_SECRET_KEY=<секретный ключ>
YOOKASSA_RETURN_URL=https://example.com/payment/success
```

Эти параметры используются для инициализации платежей и проверки webhook-уведомлений.

## Интеграция с СДЭК

Для работы доставки через СДЭК необходимо указать в `.env` следующие параметры:

```
CDEK_CLIENT_ID=<идентификатор интеграции>
CDEK_CLIENT_SECRET=<секретный ключ>
# Необязательные параметры отправителя, используются по умолчанию при расчёте тарифа
CDEK_SENDER_CITY_CODE=<код города отправителя>
CDEK_SENDER_POSTAL_CODE=<почтовый индекс отправителя>
CDEK_SENDER_ADDRESS=<адрес отправителя>
```

Доступные эндпоинты:

- `GET /api/v1/delivery/cdek/pvz` — получение списка пунктов выдачи. Поддерживает фильтрацию по `city_code`, `postal_code`, `code`, а также дополнительные параметры `type`, `limit`, `page` и т. д.
- `POST /api/v1/delivery/cdek/tariff` — расчёт стоимости доставки. При отсутствии `from_location` используются значения из переменных окружения.

При оформлении заказа дополнительные данные о выбранном пункте выдачи СДЭК передаются в объекте `delivery` и сохраняются в поле `metadata` заказа.

## Заказы и корзина

- `POST /api/v1/orders/checkout` — оформление заказа по текущей корзине пользователя и создание платежа YooKassa (требуется авторизация).
- `GET /api/v1/orders/:slug` — просмотр подробностей заказа (требуется авторизация).
- `POST /api/v1/payments/yookassa/webhook` — обработчик уведомлений YooKassa (используется сервисом).

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
