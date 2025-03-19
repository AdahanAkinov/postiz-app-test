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

  // Создаем выходную директорию
  console.log('Создаем выходную директорию...');
  execSync('mkdir -p ../../dist/apps/frontend', { stdio: 'inherit' });

  // Копируем собранные файлы Next.js в выходную директорию
  console.log('Копируем файлы сборки в выходную директорию...');
  execSync('cp -r .next ../../dist/apps/frontend/', { stdio: 'inherit' });
  
  // Копируем публичные файлы
  console.log('Копируем публичные файлы...');
  execSync('cp -r public ../../dist/apps/frontend/', { stdio: 'inherit' });

  // Проверяем структуру директории dist
  if (fs.existsSync('../../dist')) {
    console.log('Структура директории dist:');
    execSync('ls -la ../../dist', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist не существует!');
  }

  if (fs.existsSync('../../dist/apps')) {
    console.log('Структура директории dist/apps:');
    execSync('ls -la ../../dist/apps', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps не существует!');
  }

  if (fs.existsSync('../../dist/apps/frontend')) {
    console.log('Структура директории dist/apps/frontend:');
    execSync('ls -la ../../dist/apps/frontend', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps/frontend не существует!');
  }

  // Проверяем структуру .next
  if (fs.existsSync('../../dist/apps/frontend/.next')) {
    console.log('Структура директории dist/apps/frontend/.next:');
    execSync('ls -la ../../dist/apps/frontend/.next', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps/frontend/.next не существует!');
  }

  // Проверяем наличие файлов манифестов
  const requiredFiles = [
    'routes-manifest.json',
    'build-manifest.json',
    'prerender-manifest.json',
    'react-loadable-manifest.json'
  ];

  // Копируем файлы, если они существуют
  for (const file of requiredFiles) {
    const sourcePath = path.join('../../dist/apps/frontend/.next', file);
    const destPath = path.join('../../dist/apps/frontend', file);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`Копируем ${file} в корневую директорию...`);
      fs.copyFileSync(sourcePath, destPath);
    } else {
      console.log(`Файл ${file} не найден в .next директории`);
    }
  }

  // Создаем минимальный routes-manifest.json, если его нет
  const routesManifestPath = '../../dist/apps/frontend/routes-manifest.json';
  if (!fs.existsSync(routesManifestPath)) {
    console.log('Создаем минимальный routes-manifest.json...');
    const minimalRoutesManifest = {
      version: 3,
      basePath: "",
      pages404: true,
      redirects: [],
      headers: [],
      dynamicRoutes: [],
      staticRoutes: [],
      dataRoutes: [],
      rewrites: []
    };
    fs.writeFileSync(routesManifestPath, JSON.stringify(minimalRoutesManifest, null, 2));
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
  fs.writeFileSync('../../dist/apps/frontend/env-config.js', envConfigContent);

  console.log('Сборка завершена успешно!');
  process.exit(0); // Явно указываем успешное завершение
} catch (error) {
  console.error('ОШИБКА В ПРОЦЕССЕ СБОРКИ:');
  console.error(error);
  process.exit(1); // Выходим с кодом ошибки
} 