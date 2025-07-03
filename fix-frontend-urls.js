// Script para corrigir URLs do frontend automaticamente
console.log('🔧 Aplicando correção de URLs...');

// Interceptar todas as chamadas fetch
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Se for uma URL local de API, redirecionar para o backend correto
  if (typeof url === 'string' && url.startsWith('/api/companies/')) {
    const newUrl = 'https://backend-api-final-production.up.railway.app' + url;
    console.log('�� Redirecionando:', url, '->', newUrl);
    return originalFetch(newUrl, options);
  }
  return originalFetch(url, options);
};

console.log('✅ Correção aplicada! Agora todas as URLs de API serão redirecionadas.');
