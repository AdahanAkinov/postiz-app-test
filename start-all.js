const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запускаем все сервисы Postiz...');

// Функция для запуска процесса с логированием
function spawnProcess(command, args, name) {
  console.log(`📋 Запускаем ${name}: ${command} ${args.join(' ')}`);
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`⚠️ Процесс ${name} завершился с кодом ${code}`);
    // Перезапускаем процесс если он завершился с ошибкой
    if (code !== 0) {
      console.log(`🔄 Перезапуск ${name}...`);
      setTimeout(() => {
        spawnProcess(command, args, name);
      }, 5000); // Ждем 5 секунд перед перезапуском
    }
  });
  
  return proc;
}

// Определяем переменную окружения для порта
process.env.PORT = process.env.PORT || '5000';

// Запускаем бэкенд
const backend = spawnProcess('node', ['dist/apps/backend/main.js'], 'Backend');

// Запускаем фронтенд
const frontend = spawnProcess('nx', ['run', 'frontend:serve:production'], 'Frontend');

// Запускаем workers
const workers = spawnProcess('node', ['dist/apps/workers/main.js'], 'Workers');

// Запускаем cron
const cron = spawnProcess('node', ['dist/apps/cron/main.js'], 'Cron');

// Запускаем прокси
const proxy = spawnProcess('node', ['proxy-server.js'], 'Proxy');

// Обработка завершения главного процесса
process.on('SIGINT', () => {
  console.log('🛑 Завершение всех процессов...');
  backend.kill();
  frontend.kill();
  workers.kill();
  cron.kill();
  proxy.kill();
  process.exit(0);
});

console.log('✅ Все сервисы запущены! Ожидаем входящие соединения...'); 