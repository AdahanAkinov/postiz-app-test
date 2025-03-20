const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Загружаем переменные окружения из .env.production, если файл существует
  if (fs.existsSync('.env.production')) {
    console.log('Загружаем переменные окружения из .env.production...');
    require('dotenv').config({ path: '.env.production' });
  }

  // Выводим текущую директорию и её содержимое
  console.log('Текущая директория:', process.cwd());
  console.log('Содержимое текущей директории:');
  execSync('ls -la', { stdio: 'inherit' });

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
  
  // Запускаем сборку
  console.log('Запускаем сборку Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  // Восстанавливаем оригинальный next.config.js
  console.log('Восстанавливаем оригинальный next.config.js...');
  if (fs.existsSync('next.config.js.backup')) {
    fs.copyFileSync('next.config.js.backup', 'next.config.js');
    fs.unlinkSync('next.config.js.backup');
  }

  // Создаем директорию для вывода
  console.log('Создаем директорию dist...');
  execSync('mkdir -p dist', { stdio: 'inherit' });

  // Проверяем наличие директории .next
  if (!fs.existsSync('.next')) {
    console.error('ОШИБКА: Директория .next не существует после сборки!');
    process.exit(1);
  }

  // Копируем полностью папку .next
  console.log('Копируем полностью папку .next...');
  execSync('cp -r .next dist/', { stdio: 'inherit' });
  
  // Копируем public в dist/public
  console.log('Копируем публичные файлы...');
  execSync('cp -r public dist/', { stdio: 'inherit' });

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
  if (fs.existsSync('src/middleware.ts')) {
    console.log('Копируем middleware.ts...');
    // Создаем папку src если её нет
    execSync('mkdir -p dist/src', { stdio: 'inherit' });
    execSync('cp src/middleware.ts dist/src/', { stdio: 'inherit' });
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

  console.log('Сборка завершена успешно!');
  process.exit(0); // Явно указываем успешное завершение
} catch (error) {
  console.error('ОШИБКА В ПРОЦЕССЕ СБОРКИ:');
  console.error(error);
  process.exit(1); // Выходим с кодом ошибки
} 