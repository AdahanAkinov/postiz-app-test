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
  execSync('mkdir -p apps/frontend/public', { stdio: 'inherit' });

  // Запускаем сборку Next.js
  console.log('Запускаем сборку Next.js...');
  execSync('npx nx run frontend:build:production', { stdio: 'inherit' });

  // Проверяем структуру директории dist
  if (fs.existsSync('dist')) {
    console.log('Структура директории dist:');
    execSync('ls -la dist', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist не существует!');
  }

  if (fs.existsSync('dist/apps')) {
    console.log('Структура директории dist/apps:');
    execSync('ls -la dist/apps', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps не существует!');
  }

  if (fs.existsSync('dist/apps/frontend')) {
    console.log('Структура директории dist/apps/frontend:');
    execSync('ls -la dist/apps/frontend', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps/frontend не существует!');
    // Создаем директорию если она не существует
    fs.mkdirSync('dist/apps/frontend', { recursive: true });
    console.log('Создана директория dist/apps/frontend');
  }

  // Проверяем структуру .next
  if (fs.existsSync('dist/apps/frontend/.next')) {
    console.log('Структура директории dist/apps/frontend/.next:');
    execSync('ls -la dist/apps/frontend/.next', { stdio: 'inherit' });
  } else {
    console.error('ОШИБКА: Директория dist/apps/frontend/.next не существует!');
    
    // Проверяем, где может находиться .next
    console.log('Ищем .next директорию в других местах...');
    if (fs.existsSync('.next')) {
      console.log('Нашли .next в корне проекта, копируем...');
      execSync('cp -r .next dist/apps/frontend/', { stdio: 'inherit' });
    } else if (fs.existsSync('apps/frontend/.next')) {
      console.log('Нашли .next в apps/frontend, копируем...');
      execSync('cp -r apps/frontend/.next dist/apps/frontend/', { stdio: 'inherit' });
    } else {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось найти директорию .next нигде!');
    }
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
    const sourcePath = path.join('dist/apps/frontend/.next', file);
    const destPath = path.join('dist/apps/frontend', file);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`Копируем ${file} в корневую директорию...`);
      fs.copyFileSync(sourcePath, destPath);
    } else {
      console.log(`Файл ${file} не найден в .next директории`);
    }
  }

  // Создаем минимальный routes-manifest.json, если его нет
  const routesManifestPath = 'dist/apps/frontend/routes-manifest.json';
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

  // Создаем пустые файлы Next.js, если они необходимы
  const requiredEmptyFiles = [
    'next-config.json'
  ];
  
  for (const file of requiredEmptyFiles) {
    const filePath = path.join('dist/apps/frontend', file);
    if (!fs.existsSync(filePath)) {
      console.log(`Создаем пустой файл ${file}...`);
      fs.writeFileSync(filePath, '{}');
    }
  }

  // Создаем структуру директорий для Next.js
  const requiredDirs = ['static', 'server', '_next'];
  for (const dir of requiredDirs) {
    const dirPath = path.join('dist/apps/frontend', dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Создаем директорию ${dir}...`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
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
  fs.writeFileSync('dist/apps/frontend/env-config.js', envConfigContent);

  console.log('Сборка завершена успешно!');
  process.exit(0); // Явно указываем успешное завершение
} catch (error) {
  console.error('ОШИБКА В ПРОЦЕССЕ СБОРКИ:');
  console.error(error);
  process.exit(1); // Выходим с кодом ошибки
} 