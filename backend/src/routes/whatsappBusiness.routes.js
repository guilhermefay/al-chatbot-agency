const express = require('express');
const { whatsappBusinessController } = require('../controllers/whatsappBusiness.controller');
const { defaultLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Aplicar rate limiting a todas as rotas
router.use(defaultLimiter);

/**
 * @route POST /api/whatsapp-business/:companyId/configure
 * @desc Configura WhatsApp Business API para uma empresa
 */
router.post('/:companyId/configure', whatsappBusinessController.configure);

/**
 * @route GET /api/whatsapp-business/:companyId/status
 * @desc Verifica status da configuração
 */
router.get('/:companyId/status', whatsappBusinessController.getStatus);

/**
 * @route POST /api/whatsapp-business/:companyId/send/message
 * @desc Envia mensagem de texto (com chunking inteligente)
 */
router.post('/:companyId/send/message', whatsappBusinessController.sendMessage);

/**
 * @route POST /api/whatsapp-business/:companyId/send/template
 * @desc Envia mensagem com template
 */
router.post('/:companyId/send/template', whatsappBusinessController.sendTemplate);

/**
 * @route POST /api/whatsapp-business/:companyId/send/media
 * @desc Envia mensagem com mídia
 */
router.post('/:companyId/send/media', whatsappBusinessController.sendMedia);

/**
 * @route POST /api/whatsapp-business/:companyId/send/buttons
 * @desc Envia mensagem com botões interativos
 */
router.post('/:companyId/send/buttons', whatsappBusinessController.sendButtons);

/**
 * @route POST /api/whatsapp-business/:companyId/send/list
 * @desc Envia lista interativa
 */
router.post('/:companyId/send/list', whatsappBusinessController.sendList);

/**
 * @route POST /api/whatsapp-business/:companyId/send/bulk
 * @desc Disparo em massa
 */
router.post('/:companyId/send/bulk', whatsappBusinessController.sendBulk);

/**
 * @route GET /api/whatsapp-business/:companyId/templates
 * @desc Lista templates disponíveis
 */
router.get('/:companyId/templates', whatsappBusinessController.getTemplates);

/**
 * @route GET /api/whatsapp-business/:companyId/webhook
 * @desc Verificação do webhook (WhatsApp Business API)
 */
router.get('/:companyId/webhook', whatsappBusinessController.verifyWebhook);

/**
 * @route POST /api/whatsapp-business/:companyId/webhook
 * @desc Recebe webhooks do WhatsApp Business API
 */
router.post('/:companyId/webhook', whatsappBusinessController.handleWebhook);

module.exports = router;