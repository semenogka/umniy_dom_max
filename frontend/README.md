# Frontend

React + Vite + Bun. Линтер — Biome, форматтер — Prettier.

## Команды

```bash
cd frontend
bun install
bun run dev            # Vite + Storybook
bun run dev:app        # только Vite
bun run storybook      # только Storybook
bun run lint
bun run format
bun run build
```

## Структура

```
src/
  pages/         — страницы
  components/    — переиспользуемые UI
  store/         — Redux (slices, store)
  api/           — запросы / RTK Query (когда появятся)
  styles/        — токены (vars.scss)
```

## Анатомия компонента

```
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

Если в `index` нет логики связки — `*.view.tsx` не заводим, разметка живёт в `index.tsx`.

Эталон: `src/components/Icon`.

Алиас: `@/` → `src/`.

## Icon

Иконки — SVG в `src/assets/icons/`, цвет через CSS-mask (`background-color` / `currentColor`).

Чтобы добавить иконку: положить SVG в `src/assets/icons/<name>.svg` (чёрный stroke/fill). Имя файла станет `name` у `<Icon />`.
