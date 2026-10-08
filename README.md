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
Веб и мобильное приложение ходят на опубликованный сервер:
```typescript
http://51.20.85.74:5000
```
### База данных
Бэкенд подключается к **MongoDB Atlas** через `MONGODB_URI` в `backend/.env`. Скопируй `backend/.env.example` и подставь свою строку подключения.
