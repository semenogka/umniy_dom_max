# Умный дом MAX

## Backend (Docker)

Поднимает только API (Postgres не входит в compose — используется внешняя база).

1. Скопировать `.env`:

```bash
cp backend/.env.example backend/.env
```

2. Заполнить `backend/.env`: токены (`MAX_TOKEN`, `GPT_TOKEN`), `DATABASE_URL` (адрес внешнего Postgres), почтовые настройки.

3. Запустить:

```bash
docker compose up --build
```

API будет доступен на `http://localhost:8000` (Swagger — `/docs`, если `DEBUG=true`).

Остановить:

```bash
docker compose down
```
