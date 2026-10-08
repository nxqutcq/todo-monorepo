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
## Важное примечание для проверки мобильного приложения (Expo)
В файле `mobile-client/App.tsx` в переменной `API_URL` указан локальный IP-адрес для тестирования по Wi-Fi. 
Перед запуском на своем устройстве замените его на актуальный IP-адрес вашего локального сервера:
```typescript
const API_URL = 'http://ВАШ_ЛОКАЛЬНЫЙ_IP:5000';
```
### База данных
Бэкенд подключается к **MongoDB Atlas** через `MONGODB_URI` в `backend/.env`. Скопируй `backend/.env.example` и подставь свою строку подключения.
