const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Получаем URL из переменных окружения или используем значения по умолчанию
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// Прокси для бэкенда
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // удаляем /api из пути
  },
}));

// Прокси для фронтенда
app.use('/', createProxyMiddleware({
  target: FRONTEND_URL,
  changeOrigin: true,
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
}); 