const { getRegistry } = require('./src/integrations/crms/registry/CRMRegistry');
const { getManager } = require('./src/integrations/crms/CRMManager');

async function testCRMSystem() {
  console.log('🚀 Testando Sistema Modular de CRMs');
  console.log('=====================================\n');

  try {
    // 1. Testar Registry
    console.log('📋 1. Testando CRM Registry...');
    const registry = getRegistry();
    
    const availableProviders = registry.listProviders();
    console.log(`✅ Provedores disponíveis: ${availableProviders.length}`);
    
    availableProviders.forEach(provider => {
      console.log(`   - ${provider.displayName} (${provider.name})`);
      console.log(`     Descrição: ${provider.description}`);
      console.log(`     Capacidades: ${provider.capabilities.join(', ')}`);
      console.log(`     Webhook: ${provider.webhookConfig.enabled ? provider.webhookConfig.url : 'Não'}`);
      console.log('');
    });

    // 2. Testar Manager
    console.log('🎛️  2. Testando CRM Manager...');
    const manager = getManager();
    
    const managerCRMs = manager.getAvailableCRMs();
    console.log(`✅ Manager carregou ${managerCRMs.length} CRMs`);

    // 3. Testar Capacidades
    console.log('🔍 3. Testando Capacidades...');
    const capabilities = registry.getAvailableCapabilities();
    console.log(`✅ Capacidades disponíveis: ${capabilities.join(', ')}`);

    // 4. Testar ChatGuru (se disponível)
    console.log('💬 4. Testando ChatGuru...');
    if (registry.hasProvider('chatguru')) {
      const chatGuruInfo = registry.getProvider('chatguru');
      console.log(`✅ ChatGuru disponível - ${chatGuruInfo.displayName}`);
      console.log(`   Credenciais necessárias:`);
      chatGuruInfo.requiredCredentials.forEach(cred => {
        console.log(`     - ${cred.displayName} (${cred.name}): ${cred.description}`);
      });
    } else {
      console.log('❌ ChatGuru não encontrado');
    }

    // 5. Testar Stats
    console.log('📊 5. Estatísticas do Sistema...');
    const stats = registry.getStats();
    console.log(`✅ Total de provedores: ${stats.totalProviders}`);
    console.log(`✅ Provedores ativos: ${stats.activeProviders}`);
    console.log(`✅ Capacidades únicas: ${stats.availableCapabilities.length}`);

    console.log('\n🎉 Sistema de CRM testado com sucesso!');
    console.log('=====================================');
    
    return true;

  } catch (error) {
    console.error('❌ Erro no teste do sistema de CRM:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Executar teste se executado diretamente
if (require.main === module) {
  testCRMSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testCRMSystem }; 