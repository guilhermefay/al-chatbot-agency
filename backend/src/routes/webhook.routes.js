const express = require('express');
const router = express.Router();
const { webhookController } = require('../controllers/webhook.controller');

// Evolution API webhook
router.post('/evolution/:instanceId', webhookController.handleEvolutionWebhook);

// Dify webhook for tool callbacks
router.post('/dify/tools/:toolId', webhookController.handleDifyToolCallback);

// Dify Function Calling endpoint
router.post('/dify/function/:companyId', webhookController.handleDifyFunctionCall);

module.exports = router;