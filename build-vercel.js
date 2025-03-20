const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('====== НАЧАЛО СБОРКИ VERCEL ======');
  console.log('Текущая директория:', process.cwd());
  console.log('Установка необходимых зависимостей...');
  
  // Используем cp -f для принудительного копирования
  try {
    console.log('Копируем приложение Next.js в корневую директорию...');
    execSync('cp -rf apps/frontend/. ./', { stdio: 'inherit' });
    console.log('Копирование завершено');
  } catch (e) {
    console.error('Ошибка при копировании:', e);
  }
  
  // Проверим, что получилось
  console.log('Проверяем содержимое директории после копирования:');
  execSync('ls -la', { stdio: 'inherit' });
  
  // Проверяем наличие package.json и next.config.js
  if (!fs.existsSync('package.json')) {
    console.error('ОШИБКА: package.json не найден!');
  }
  
  if (!fs.existsSync('next.config.js')) {
    console.error('ОШИБКА: next.config.js не найден!');
  }
  
  // Загружаем переменные окружения
  if (fs.existsSync('.env.production')) {
    console.log('Загружаем переменные окружения из .env.production...');
    require('dotenv').config({ path: '.env.production' });
  }
  
  // Создаем директорию public если она не существует
  console.log('Создаем директорию public...');
  execSync('mkdir -p public', { stdio: 'inherit' });
  
  // Копируем или создаем env.js для клиентских переменных
  console.log('Создаем файл env.js для клиентских переменных...');
  const envConfigContent = `
window.env = {
  NEXT_PUBLIC_BACKEND_URL: "${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api'}",
  NEXT_PUBLIC_UPLOAD_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_DIRECTORY || '/uploads'}",
  NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY || '/uploads'}"
};
`;
  fs.writeFileSync('public/env.js', envConfigContent);
  
  // Запускаем сборку Next.js
  console.log('Запускаем сборку Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  // Проверяем наличие директории .next после сборки
  if (!fs.existsSync('.next')) {
    console.error('ОШИБКА: Директория .next не существует после сборки!');
    process.exit(1);
  }
  
  // Создаем директорию для вывода
  console.log('Создаем директорию dist...');
  execSync('mkdir -p dist', { stdio: 'inherit' });
  
  // Копируем все нужные файлы в dist
  console.log('Копируем папку .next в dist...');
  execSync('cp -r .next dist/', { stdio: 'inherit' });
  
  console.log('Копируем public в dist...');
  execSync('cp -r public dist/', { stdio: 'inherit' });
  
  // Создаем package.json для Vercel
  console.log('Создаем package.json для Vercel...');
  const packageJson = {
    "name": "postiz-app",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next",
      "build": "next build",
      "start": "next start"
    },
    "dependencies": {
      "next": "14.2.24",
      "react": "18.3.1",
      "react-dom": "18.3.1"
    }
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
  
  // Создаем next.config.js для Vercel
  console.log('Создаем next.config.js для Vercel...');
  const vercelNextConfig = `
module.exports = {
  env: {
    NEXT_PUBLIC_BACKEND_URL: "${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api'}",
    NEXT_PUBLIC_UPLOAD_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_DIRECTORY || '/uploads'}",
    NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY || '/uploads'}"
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: "${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api'}/:path*",
      },
      {
        source: '/uploads/:path*',
        destination: "${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api'}/uploads/:path*",
      }
    ];
  }
};
`;
  fs.writeFileSync('dist/next.config.js', vercelNextConfig);
  
  // Проверяем, есть ли у нас pages в выходной директории
  if (!fs.existsSync('dist/pages')) {
    console.log('Создаем директорию pages...');
    execSync('mkdir -p dist/pages', { stdio: 'inherit' });
  }
  
  // Если нет файлов в pages, создаем минимальную страницу
  const pagesFiles = fs.readdirSync('dist/pages');
  if (pagesFiles.length === 0) {
    console.log('Создаем минимальную страницу index.js...');
    const indexContent = `
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth/login');
  }, []);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Loading...</h1>
    </div>
  );
}
`;
    fs.writeFileSync('dist/pages/index.js', indexContent);
  }
  
  // Проверяем структуру директории dist
  console.log('Проверяем финальную структуру директории dist:');
  execSync('ls -la dist', { stdio: 'inherit' });
  execSync('ls -la dist/.next', { stdio: 'inherit' });
  
  console.log('====== СБОРКА VERCEL ЗАВЕРШЕНА УСПЕШНО ======');
  process.exit(0);
} catch (error) {
  console.error('====== ОШИБКА В ПРОЦЕССЕ СБОРКИ VERCEL ======');
  console.error(error);
  console.error('Стек вызовов:', error.stack);
  process.exit(1);
} 