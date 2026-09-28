# Домовой — backend

<p align="center"><img src="assets/hero.png" alt="Баннер backend: карточка обращения проходит через узел классификации и расходится по потокам к базе данных и письму" width="100%"></p>

API мини-приложения и бот MAX в одном Python-пакете. API принимает обращения жителей, классифицирует их через LLM, отправляет письма в управляющую компанию и рассылает обновления по WebSocket. Бот регистрирует жителей и показывает их обращения прямо в чате.

Общее описание проекта и запуск всех компонентов разом описаны в [корневом README](../README.md).

## Быстрый старт

Нужны [uv](https://docs.astral.sh/uv/) и PostgreSQL. Проще всего поднять базу из корневого Compose:

```bash
cp .env.example .env          # впишите GPT_TOKEN, MAX_TOKEN, MAIL_PASSWORD и DATABASE_URL
uv sync
uv run seed seed/data.json    # тестовые дома, демо-житель и обращение
uv run api                    # http://localhost:8000/docs
```

Бот запускается отдельным процессом:

```bash
uv run bot
```

## Команды

Команды объявлены в `[project.scripts]` файла [pyproject.toml](pyproject.toml). В Docker они же служат `command` контейнера.

| Команда | Что делает |
| --- | --- |
| `api` | FastAPI на `HOST:PORT`, при старте создаёт таблицы и запускает опрос почтового ящика |
| `bot` | long polling MAX Bot API: регистрация по `bot_started`, кнопка «Мои обращения» |
| `seed [путь]` | заполняет базу из JSON, только если в ней нет домов; по умолчанию `/seed/data.json` |
| `clear-db` | удаляет схему `public` и создаёт таблицы заново |

> [!CAUTION]
> `clear-db` стирает все данные в базе из `DATABASE_URL` без подтверждения.

## Устройство

```text
src/umniy_dom_max/
  cmd/              — точки входа: api, bot, seed, clear_db
  db/
    models.py       — SQLAlchemy-модели
    repository.py   — все запросы к базе
    database.py     — движок, сессии, создание таблиц
  handlers.py       — REST- и WebSocket-эндпоинты
  schemas.py        — Pydantic-схемы запросов и ответов
  llm.py, prompts.py — агенты Pydantic AI: классификация обращения и ответа УК
  mail.py           — отправка по SMTP и чтение по IMAP
  mail_monitoring.py — фоновая задача: раз в 10 секунд читает ответы УК
  html.py           — HTML-шаблоны писем
  ws.py             — комнаты WebSocket в памяти процесса
  settings.py       — настройки из переменных окружения
```

Обработчики не ходят в базу сами, только через `repository`. Зависимости (сессия, LLM-агенты, настройки, менеджер WebSocket) подключаются через `Depends` из [dependencies.py](src/umniy_dom_max/dependencies.py).

## Классификация обращений

Текст обращения уходит агенту `appeal_classifier`. Он возвращает структурированный ответ:

| Поле | Значения |
| --- | --- |
| `problem_type` | освещение подъезда, ЖКХ, дороги, мусор, благоустройство, водоснабжение, отопление, лифт, другая |
| `urgency` | низкий, средний, высокий, критичный |
| `responsible_org` | управляющая компания, администрация города, водоканал, электросети, дорожная служба, региональный оператор ТКО, другая |
| `deadline_days`, `deadline_text` | срок в днях и его текстовое описание |
| `action_plan` | что сделает исполнитель |

Если тип определён как «другая», обращение не создаётся и API отвечает `403`. Дополнения к обращению проходят ту же проверку.

Второй агент читает ответы УК из почты и решает, какой статус поставить: `dop` или `checked`. Обращение находится по теме письма.

## API

Полное описание со схемами открывается в Swagger на `/docs`, если `DEBUG=true`.

| Метод и путь | Что делает |
| --- | --- |
| `POST /users/demo` | создать демо-пользователя со случайными домами |
| `GET /users/{user_id}` | профиль, дома и обращения |
| `GET /users/{user_id}/houses` | дома пользователя |
| `GET /users/{user_id}/appeals` | обращения пользователя с сообщениями |
| `GET /users/{user_id}/appeals/short` | обращения без сообщений |
| `POST /appeals/create` | создать обращение: LLM, письмо, запись в базу |
| `PATCH /appeals/{appeal_id}/update` | сменить статус и уведомить жителя в MAX |
| `GET /appeals/{appeal_id}/messages` | обращение с перепиской |
| `POST /appeals/{appeal_id}/message` | дополнить обращение |
| `GET /houses` | все дома |
| `POST /houses` | добавить дом |
| `GET /houses/{house_id}/messages` | общий чат дома |
| `POST /houses/{house_id}/message` | написать в чат дома |
| `GET /houses/{house_id}/appeals` | обращения по дому |

WebSocket: `/ws/houses/{house_id}?user_id=…` и `/ws/appeals/{appeal_id}?user_id=…`. Сервер присылает события `message`, `read`, `appeal_created` и `appeal_updated`. Клиент отправляет `{"type": "read", "message_ids": [...]}`, чтобы отметить сообщения прочитанными.

## Модель данных

```mermaid
erDiagram
    users ||--o{ appeals : "автор"
    users }o--o{ houses : "user_houses"
    houses ||--o{ house_messages : "чат дома"
    appeals ||--o{ appeal_messages : "переписка"
    appeal_messages ||--o{ message_attachments : ""
    house_messages ||--o{ message_attachments : ""
```

Пользователь с `id = 0` — это бот. Он создаётся при старте API, и от его имени пишутся системные сообщения. Обращение связано с домом через адрес `appeal_address`, а не через внешний ключ.

## Переменные окружения

Все настройки перечислены в [settings.py](src/umniy_dom_max/settings.py), шаблон лежит в [.env.example](.env.example). Таблица с описанием есть в [корневом README](../README.md#переменные-окружения).

## Docker

[Dockerfile](Dockerfile) собирает образ в два этапа: `uv sync --locked` в builder, затем только `.venv` и исходники в runtime. По умолчанию запускается `api`, другой процесс выбирается через `command`: `bot`, `seed`.

В образе `ROOT_PATH=/api`, потому что на проде API стоит за nginx под префиксом `/api`. Корневой Compose сбрасывает его в пустую строку.
