const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { defaultLimiter } = require('../middlewares/rateLimiter');

/**
 * Rotas para gerenciamento de CRMs
 */

// Aplicar rate limiting padrão em todas as rotas
router.use(defaultLimiter);

/**
 * Rotas públicas/administrativas
 */

// GET /api/crms/available - Lista todos os CRMs disponíveis
router.get('/available', crmController.getAvailableCRMs.bind(crmController));

/**
 * Rotas por empresa
 */

// GET /api/companies/:companyId/crms - Lista CRMs configurados para uma empresa
router.get('/companies/:companyId/crms', crmController.getCompanyCRMs.bind(crmController));

// GET /api/companies/:companyId/crms/stats - Estatísticas dos CRMs da empresa
router.get('/companies/:companyId/crms/stats', crmController.getCRMStats.bind(crmController));

// POST /api/companies/:companyId/crms/:providerName/configure - Configura um CRM
router.post('/companies/:companyId/crms/:providerName/configure', crmController.configureCRM.bind(crmController));

// POST /api/companies/:companyId/crms/:providerName/test - Testa conexão com CRM
router.post('/companies/:companyId/crms/:providerName/test', crmController.testCRMConnection.bind(crmController));

// DELETE /api/companies/:companyId/crms/:providerName - Remove/desativa um CRM
router.delete('/companies/:companyId/crms/:providerName', crmController.removeCRM.bind(crmController));

/**
 * Operações de CRM
 */

// POST /api/companies/:companyId/crms/sync-contact - Sincroniza contato com todos os CRMs
router.post('/companies/:companyId/crms/sync-contact', crmController.syncContact.bind(crmController));

// POST /api/companies/:companyId/crms/:providerName/send-message - Envia mensagem
router.post('/companies/:companyId/crms/:providerName/send-message', crmController.sendMessage.bind(crmController));

// POST /api/companies/:companyId/crms/:providerName/add-note - Adiciona nota
router.post('/companies/:companyId/crms/:providerName/add-note', crmController.addNote.bind(crmController));

// POST /api/companies/:companyId/crms/:providerName/trigger-automation - Dispara automação
router.post('/companies/:companyId/crms/:providerName/trigger-automation', crmController.triggerAutomation.bind(crmController));

/**
 * Webhooks
 */

// POST /api/webhooks/crm/:providerName - Processa webhook de CRM
router.post('/webhooks/crm/:providerName', crmController.processWebhook.bind(crmController));

/**
 * Middleware de tratamento de erros específico para CRM
 */
router.use((error, req, res, next) => {
  console.error('[CRM Routes] Error:', error.message);
  
  // Erros específicos de CRM
  if (error.message.includes('CRM provider') && error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: 'Provedor de CRM não encontrado',
      error: error.message
    });
  }

  if (error.message.includes('Credenciais inválidas')) {
    return res.status(401).json({
      success: false,
      message: 'Credenciais do CRM são inválidas',
      error: error.message
    });
  }

  if (error.message.includes('não está ativo')) {
    return res.status(400).json({
      success: false,
      message: 'CRM não está configurado ou ativo',
      error: error.message
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do sistema de CRM',
    error: error.message
  });
});

module.exports = router; 