const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Определяем пути
const rootDir = process.cwd();
const frontendDir = path.join(rootDir, 'apps', 'frontend');

try {
  console.log('====== НАЧАЛО СБОРКИ ======');
  console.log('Текущая директория (rootDir):', rootDir);
  console.log('Путь к frontend:', frontendDir);
  console.log('Содержимое корневого каталога:');
  execSync('ls -la', { stdio: 'inherit' });
  
  // Переходим в директорию frontend для дальнейшей работы
  console.log('Переходим в директорию frontend...');
  process.chdir(frontendDir);
  console.log('Новая текущая директория:', process.cwd());
  console.log('Содержимое директории frontend:');
  execSync('ls -la', { stdio: 'inherit' });

  // Загружаем переменные окружения из .env.production, если файл существует
  if (fs.existsSync('.env.production')) {
    console.log('Загружаем переменные окружения из .env.production...');
    require('dotenv').config({ path: '.env.production' });
  } else {
    console.log('Файл .env.production не найден. Проверяем в корне проекта...');
    const rootEnvPath = path.join(rootDir, '.env.production');
    if (fs.existsSync(rootEnvPath)) {
      console.log('Загружаем переменные окружения из корня проекта...');
      require('dotenv').config({ path: rootEnvPath });
    } else {
      console.log('Файл .env.production не найден ни в frontend, ни в корне проекта.');
    }
  }

  // Создаем директорию public если она не существует
  console.log('Создаем директорию public...');
  execSync('mkdir -p public', { stdio: 'inherit' });
  
  // Добавляем файл .gitkeep в public
  console.log('Добавляем .gitkeep в директорию public...');
  fs.writeFileSync('public/.gitkeep', '');

  // Вместо запуска через Nx, используем напрямую Next.js с правильными настройками для Vercel
  console.log('Запускаем сборку Next.js с настройкой для Vercel...');
  
  // Создаем временный next.config.js для Vercel
  const tempNextConfig = `
  const { composePlugins, withNx } = require('@nx/next');

  const nextConfig = {
    nx: {
      svgr: false,
    },
    transpilePackages: ['crypto-hash'],
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: '**',
        },
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
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
  
  const plugins = [
    withNx,
  ];
  
  module.exports = composePlugins(...plugins)(nextConfig);
  `;
  
  // Сохраняем оригинальный next.config.js
  console.log('Сохраняем оригинальный next.config.js...');
  if (fs.existsSync('next.config.js')) {
    fs.copyFileSync('next.config.js', 'next.config.js.backup');
  }
  
  // Записываем временный next.config.js
  console.log('Записываем временный next.config.js для Vercel...');
  fs.writeFileSync('next.config.js', tempNextConfig);
  
  // Установка зависимостей (на всякий случай)
  console.log('Проверка node_modules...');
  if (!fs.existsSync('node_modules')) {
    console.log('node_modules отсутствует, пробуем установить зависимости...');
    execSync('npm install --no-save', { stdio: 'inherit' });
  }
  
  // Запускаем сборку
  console.log('Запускаем сборку Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  // Восстанавливаем оригинальный next.config.js
  console.log('Восстанавливаем оригинальный next.config.js...');
  if (fs.existsSync('next.config.js.backup')) {
    fs.copyFileSync('next.config.js.backup', 'next.config.js');
    fs.unlinkSync('next.config.js.backup');
  }

  // Возвращаемся в корневую директорию
  process.chdir(rootDir);
  
  // Создаем директорию для вывода
  console.log('Создаем директорию dist...');
  execSync('mkdir -p dist', { stdio: 'inherit' });

  // Проверяем наличие директории .next
  const nextDir = path.join(frontendDir, '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('ОШИБКА: Директория .next не существует после сборки!');
    console.error('Путь к .next должен быть:', nextDir);
    process.exit(1);
  }

  // Копируем полностью папку .next
  console.log('Копируем полностью папку .next...');
  execSync(`cp -r ${nextDir} dist/`, { stdio: 'inherit' });
  
  // Копируем public в dist/public
  console.log('Копируем публичные файлы...');
  execSync(`cp -r ${path.join(frontendDir, 'public')} dist/`, { stdio: 'inherit' });

  // Копируем package.json и создаем базовые файлы для Vercel
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

  // Копируем next.config.js в dist
  console.log('Копируем next.config.js в dist...');
  // Для Vercel создаем упрощённый next.config.js
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

  // Если есть middleware.ts, копируем его
  const middlewarePath = path.join(frontendDir, 'src/middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    console.log('Копируем middleware.ts...');
    // Создаем папку src если её нет
    execSync('mkdir -p dist/src', { stdio: 'inherit' });
    execSync(`cp ${middlewarePath} dist/src/`, { stdio: 'inherit' });
  }

  // Создаем файл env-config.js для клиентских переменных окружения
  console.log('Создаем файл env-config.js для клиентских переменных...');
  const envConfigContent = `
window.env = {
  NEXT_PUBLIC_BACKEND_URL: "${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api'}",
  NEXT_PUBLIC_UPLOAD_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_DIRECTORY || '/uploads'}",
  NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY: "${process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY || '/uploads'}"
};
`;
  fs.writeFileSync('dist/public/env.js', envConfigContent);
  
  // Создаем пустую страницу index.js в dist/pages, если нет страниц
  console.log('Проверяем наличие страниц...');
  
  // Проверяем, существует ли уже папка pages
  if (!fs.existsSync('dist/pages')) {
    console.log('Создаем директорию pages...');
    execSync('mkdir -p dist/pages', { stdio: 'inherit' });
  }
  
  // Если директория dist/pages пуста, создаем минимальную страницу index.js
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

  // Проверяем структуру директории
  console.log('Проверяем структуру директории dist...');
  execSync('ls -la dist', { stdio: 'inherit' });
  execSync('ls -la dist/.next', { stdio: 'inherit' });

  console.log('====== СБОРКА ЗАВЕРШЕНА УСПЕШНО ======');
  process.exit(0); // Явно указываем успешное завершение
} catch (error) {
  console.error('====== ОШИБКА В ПРОЦЕССЕ СБОРКИ ======');
  console.error(error);
  console.error('Стек вызовов:', error.stack);
  process.exit(1); // Выходим с кодом ошибки
} 