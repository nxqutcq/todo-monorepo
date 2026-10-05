# Todo Monorepo (React + Expo + Express)

Тестовое задание выполнено в виде монорепозитория со строгой темной темой и полной валидацией данных.

## Структура проекта
- `/backend` — TypeScript Express сервер с JWT-авторизацией и In-Memory Mock базой данных. Полностью покрыт автотестами (Jest + Supertest).
- `/web-client` — Веб-приложение на React + Vite + Tailwind CSS.
- `/mobile-client` — Мобильное приложение на Expo (React Native) с поддержкой AsyncStorage.

## Быстрый запуск

### 1. Запуск Бэкенда
```bash
cd backend
npm install
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
