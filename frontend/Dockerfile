# Сборка
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# На проде API за тем же доменом под /api (nginx на хосте)
ARG VITE_API_URL=/api
RUN bun run build

# Раздача статики
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
