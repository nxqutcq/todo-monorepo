# Todo Monorepo (React + Expo + Express)

Тестовое задание выполнено в виде монорепозитория со строгой темной темой и полной валидацией данных.

## Структура проекта
- `/backend` — TypeScript Express сервер с JWT-авторизацией и MongoDB Atlas. Покрыт автотестами (Jest + Supertest).
- `/web-client` — Веб-приложение на React + Vite + Tailwind CSS.
- `/mobile-client` — Мобильное приложение на Expo (React Native) с поддержкой AsyncStorage.

## Быстрый запуск

### 1. Запуск Бэкенда
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
*Для запуска интеграционных тестов:* `npm run test`

### 2. Запуск Веб-клиента
```bash
cd web-client
npm install
npm run dev
```

### 3. Запуск Мобильного приложения
```bash
cd mobile-client
npm install
npm run start
```
## API на EC2
Клиенты ходят на HTTPS (иначе Amplify блокирует Mixed Content):
```text
https://51.20.85.74.sslip.io
```
На EC2 Node слушает `127.0.0.1:5000`, снаружи HTTPS даёт Caddy (`Caddyfile` в корне репо). В Security Group открой **80** и **443**.

```bash
sudo apt-get update
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
sudo cp ~/todo-monorepo/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```
### База данных
Бэкенд подключается к **MongoDB Atlas** через `MONGODB_URI` в `backend/.env`. Скопируй `backend/.env.example` и подставь свою строку подключения.

### Вложения (S3)
К задаче можно прикрепить один файл. Он лежит в **приватном** бакете S3 (Block Public Access). В MongoDB сохраняется только ключ объекта (`attachmentKey`), не публичная ссылка. Скачивание только через `GET /todos/:id/attachment` с JWT владельца.

На EC2 в `.env` добавь `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`.
