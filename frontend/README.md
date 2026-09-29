# Домовой — frontend

<p align="center"><img src="assets/hero.png" alt="Баннер «Домовой — frontend»: смартфон с чатом мини-приложения, фото в сообщении, статусом и карточками карты дома" width="100%"></p>

Мини-приложение «Домового» для MAX. Житель входит через демо-экран ЕСИА, переписывается в общем чате дома, создаёт обращения с фото и следит за их статусом. Новые сообщения и смена статуса приходят по WebSocket без перезагрузки.

Сделано на React, Vite и Bun. Линтер — Biome, форматтер — Prettier. Общее описание проекта лежит в [корневом README](../README.md).

## Быстрый старт

Нужен [Bun](https://bun.sh) и запущенный [backend](../backend/README.md) на `localhost:8000`.

```bash
cd frontend
cp .env.example .env
bun install
bun run dev:app
```

В режиме разработки приложение работает от имени пользователя `id = 1`. Это демо-житель из тестовых данных.

## Команды

```bash
bun run dev            # Vite + Storybook
bun run dev:app        # только Vite
bun run storybook      # только Storybook на :6006
bun run lint
bun run format
bun run build
```

## Связь с MAX

Страница подключает MAX Bridge (`https://st.max.ru/js/max-web-app.js`) и после старта вызывает `window.WebApp.ready()`: без этого iOS-клиент MAX не убирает свой загрузчик. Id, имя и фото пользователя, а также id чата берутся из `window.WebApp.initDataUnsafe`, это делает [src/max/webApp.ts](src/max/webApp.ts).

Вне MAX объекта `WebApp` нет. Тогда пользователь и чат определяются так:

| Режим | Пользователь |
| --- | --- |
| `bun run dev` | всегда `id = 1`, чат тоже `1` |
| сборка с `VITE_DEMO_USER_ID` и `VITE_DEMO_CHAT_ID` | значения переменных; так работает локальный Docker |
| прод без MAX | нет пользователя, данные не загружаются |

## Вход через ЕСИА

При запуске приложение вызывает `POST /users/demo` без пароля. Если житель уже есть в базе, API возвращает его и обновляет аватар из MAX.

Для нового жителя API отвечает `401`, и приложение показывает демо-экран «Вход через ЕСИА» ([EsiaAuth](src/pages/Chat/components/EsiaAuth/index.tsx)). Житель вводит пароль, API сверяет его с `ESIA_PASSWORD` и регистрирует жителя. Неверный пароль показывается ошибкой под полем.

Для этого экрана `index.html` подключает шрифт Lato из Google Fonts.

## Фото во вложениях

К сообщению можно приложить до 10 фото: jpeg, png, webp, heic/heif, bmp, tiff. Браузер сжимает каждое до 1200 px по длинной стороне, JPEG с качеством 0.45, и отклоняет файлы больше 10 МБ после сжатия. Бэкенд проверяет тот же лимит, а nginx пропускает тело запроса до 10 МБ. Настройки лежат в [MessageInput.config.ts](src/components/MessageInput/MessageInput.config.ts).

## Переменные окружения

| Переменная | Назначение | Прод | Локальный Docker |
| --- | --- | --- | --- |
| `VITE_API_URL` | базовый адрес API и WebSocket | `/api` | `http://localhost:8000` |
| `VITE_DEMO_USER_ID` | пользователь вне MAX | не задаётся | `1` |
| `VITE_DEMO_CHAT_ID` | чат MAX вне MAX | не задаётся | не задаётся |

Это переменные сборки: Vite вшивает их в бандл. В Docker они передаются через `build.args`.

## Структура

```text
src/
  pages/Chat/     — единственная страница: чат дома или обращения, экран входа, боковые листы и «Мой дом» с картой
  components/     — переиспользуемые UI-компоненты со stories
  store/          — Redux Toolkit: пользователь, дома, обращения, чаты
  api/            — fetch-клиент и WebSocket
  hooks/          — подписки на WebSocket дома и обращения
  max/            — работа с MAX Bridge
  styles/         — токены (vars.scss)
```

Маршруты: `/chat`, `/chat/:houseId` и `/chat/:houseId/:appealId`.

Алиас `@/` указывает на `src/`.

## Анатомия компонента

```text
MyWidget/
  index.tsx                  — публичный API (разметка, если нет отдельной логики)
  MyWidget.view.tsx          — разметка (если index только связывает container)
  MyWidget.container.tsx     — хуки/состояние (если нужно)
  MyWidget.service.ts        — только переиспользуемые функции (без переменных)
  MyWidget.types.ts
  MyWidget.module.scss
  MyWidget.stories.tsx
  MyWidget.test.tsx
  MyWidget.config.ts         — переменные / константы
```

Если в `index` нет логики связки, `*.view.tsx` не заводим, и разметка живёт в `index.tsx`.

## Иконки

Иконки — это SVG в `src/assets/icons/`. Цвет задаётся через CSS-маску (`background-color` / `currentColor`).

Чтобы добавить иконку, положите SVG с чёрным stroke или fill в `src/assets/icons/<name>.svg`. Имя файла станет пропом `name` у `<Icon />`.

## Docker

[Dockerfile](Dockerfile) собирает бандл в образе `oven/bun`, а раздаёт его nginx ([nginx.conf](nginx.conf)): SPA-fallback на `index.html` и вечный кэш для `/assets/`.

На проде `/api` проксирует nginx хоста. Локально фронтенд ходит в API напрямую по `VITE_API_URL`.
