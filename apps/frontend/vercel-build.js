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

  // Вместо запуска через Nx, используем напрямую Next.js
  console.log('Запускаем сборку Next.js напрямую...');
  execSync('npx next build', { stdio: 'inherit' });

  // Создаем выходную директорию для Vercel (это должен быть корневой каталог)
  console.log('Создаем выходную директорию...');
  execSync('mkdir -p dist', { stdio: 'inherit' });

  // Копируем .next директорию целиком
  console.log('Копируем файлы сборки .next...');
  execSync('cp -r .next dist/', { stdio: 'inherit' });
  
  // Копируем публичные файлы
  console.log('Копируем публичные файлы...');
  execSync('cp -r public dist/', { stdio: 'inherit' });

  // Создаем package.json для Vercel с правильными скриптами запуска
  console.log('Создаем package.json для Vercel...');
  const packageJson = {
    "name": "postiz-app",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
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

  // Копируем next.config.js
  console.log('Копируем next.config.js...');
  execSync('cp next.config.js dist/', { stdio: 'inherit' });
  
  // Копируем middleware.js, если он существует
  if (fs.existsSync('src/middleware.ts')) {
    console.log('Копируем middleware.ts...');
    execSync('cp src/middleware.ts dist/', { stdio: 'inherit' });
  }

  // Копируем .env.production для корректной работы
  console.log('Копируем .env.production...');
  execSync('cp .env.production dist/', { stdio: 'inherit' });

  // Копируем все необходимые файлы
  const requiredFiles = [
    'routes-manifest.json',
    'build-manifest.json',
    'prerender-manifest.json',
    'react-loadable-manifest.json'
  ];

  // Копируем файлы, если они существуют
  for (const file of requiredFiles) {
    const sourcePath = path.join('dist/.next', file);
    const destPath = path.join('dist', file);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`Копируем ${file} в корневую директорию...`);
      fs.copyFileSync(sourcePath, destPath);
    } else {
      console.log(`Файл ${file} не найден в .next директории`);
    }
  }

  // Проверяем структуру директории dist
  console.log('Структура выходной директории dist:');
  execSync('ls -la dist', { stdio: 'inherit' });
  console.log('Структура директории dist/.next:');
  execSync('ls -la dist/.next', { stdio: 'inherit' });

  // Создаем next.config.js в выходной директории, если его там нет
  if (!fs.existsSync('dist/next.config.js')) {
    console.log('Создаем next.config.js в выходной директории...');
    const nextConfig = `
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
    fs.writeFileSync('dist/next.config.js', nextConfig);
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

  console.log('Сборка завершена успешно!');
  process.exit(0); // Явно указываем успешное завершение
} catch (error) {
  console.error('ОШИБКА В ПРОЦЕССЕ СБОРКИ:');
  console.error(error);
  process.exit(1); // Выходим с кодом ошибки
} 