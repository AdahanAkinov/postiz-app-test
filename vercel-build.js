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
const files = fs.readdirSync('dist/apps/frontend');
console.log(files);

// Проверяем структуру .next
if (fs.existsSync('dist/apps/frontend/.next')) {
  console.log('Структура директории dist/apps/frontend/.next:');
  const nextFiles = fs.readdirSync('dist/apps/frontend/.next');
  console.log(nextFiles);
}

// Копируем все необходимые файлы из .next в корневую директорию
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

// Копируем всю директорию .next в корень выходной директории
if (fs.existsSync('dist/apps/frontend/.next')) {
  console.log('Копируем содержимое .next директории...');
  
  // Создаем функцию для рекурсивного копирования директории
  function copyDirSync(src, dest) {
    // Создаем директорию назначения, если она не существует
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Получаем содержимое директории
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    // Копируем каждый элемент
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        // Рекурсивно копируем поддиректории
        copyDirSync(srcPath, destPath);
      } else {
        // Копируем файлы
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  // Копируем важные поддиректории
  const nextSubDirs = ['server', 'static'];
  for (const dir of nextSubDirs) {
    const sourcePath = path.join('dist/apps/frontend/.next', dir);
    const destPath = path.join('dist/apps/frontend', dir);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`Копируем директорию ${dir}...`);
      copyDirSync(sourcePath, destPath);
    }
  }
}

console.log('Сборка завершена!'); 