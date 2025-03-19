const { spawnSync, spawn } = require('child_process');
const path = require('path');

console.log('🏗️ Запускаем сборку и настройку приложения для Railway...');

// Функция для запуска команды с ожиданием результата
function runCommand(command, args) {
  console.log(`🔨 Выполняем: ${command} ${args.join(' ')}`);
  
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error(`❌ Команда завершилась с ошибкой: ${result.status}`);
    process.exit(result.status);
  }
  
  return result;
}

// Сборка приложения
runCommand('npm', ['run', 'build']);

// Проверяем, нужно ли мигрировать базу данных
if (process.env.SKIP_DB_PUSH !== 'true') {
  // Миграция базы данных
  runCommand('npm', ['run', 'prisma-db-push']);
}

// Запускаем приложение
console.log('🚀 Запускаем приложение...');
const app = spawn('node', ['start-all.js'], {
  stdio: 'inherit',
  shell: true
});

// Обработка завершения процесса
app.on('close', (code) => {
  console.log(`⚠️ Приложение завершило работу с кодом: ${code}`);
  process.exit(code);
}); 