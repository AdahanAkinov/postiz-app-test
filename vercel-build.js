const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Создаем директорию public если она не существует
console.log('Создаем директорию public...');
execSync('mkdir -p apps/frontend/public');

// Запускаем сборку Next.js
console.log('Запускаем сборку Next.js...');
execSync('npx nx run frontend:build:production');

// Проверяем структуру директории dist
console.log('Структура директории dist/apps/frontend:');
const distFiles = fs.readdirSync('dist/apps/frontend');
console.log(distFiles);

// Если нужный файл не найден, копируем его
if (!fs.existsSync('dist/apps/frontend/routes-manifest.json') && fs.existsSync('dist/apps/frontend/.next/routes-manifest.json')) {
  console.log('Копируем routes-manifest.json в корневую директорию...');
  fs.copyFileSync(
    'dist/apps/frontend/.next/routes-manifest.json',
    'dist/apps/frontend/routes-manifest.json'
  );
}

// Создаем симлинк на .next, если он не существует
if (!fs.existsSync('dist/apps/frontend/.next')) {
  console.log('Создаем симлинк на .next...');
  fs.symlinkSync(
    path.resolve('dist/apps/frontend/.next'),
    path.resolve('dist/apps/frontend/.next'),
    'dir'
  );
}

console.log('Сборка завершена!'); 