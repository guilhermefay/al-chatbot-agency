// Script de inicialização do backend
const { spawn } = require('child_process');

console.log('🚀 Iniciando AL Chatbot Backend...');

// Iniciar o servidor
const server = spawn('node', ['src/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || 3001 }
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🔴 Servidor fechado com código: ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Recebido SIGTERM, fechando servidor...');
  server.kill();
});

process.on('SIGINT', () => {
  console.log('📴 Recebido SIGINT, fechando servidor...');
  server.kill();
}); 