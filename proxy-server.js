const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Константы для URL'ов
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:4200';

console.log(`[Proxy] Настроен на бэкенд: ${BACKEND_URL}`);
console.log(`[Proxy] Настроен на фронтенд: ${FRONTEND_URL}`);

// Прокси для бэкенда
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // удаляем /api из пути
  },
  logLevel: 'debug'
}));

// Прокси для фронтенда
app.use('/', createProxyMiddleware({
  target: FRONTEND_URL,
  changeOrigin: true,
  ws: true, // поддержка веб-сокетов для фронтенда
  logLevel: 'debug'
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Сервер запущен на порту ${PORT}`);
  console.log(`[Proxy] Вы можете открыть http://localhost:${PORT} в браузере`);
}); 