const express = require('express');
const router = express.Router();

const webhookRoutes = require('./webhook.routes');
const companyRoutes = require('./company.routes');
const conversationRoutes = require('./conversation.routes');
const documentRoutes = require('./document.routes');
const integrationRoutes = require('./integration.routes');
const testRoutes = require('./test.routes');
const crmRoutes = require('./crm');
const whatsappBusinessRoutes = require('./whatsappBusiness.routes');

router.use('/webhook', webhookRoutes);
router.use('/companies', companyRoutes);
router.use('/conversations', conversationRoutes);
router.use('/documents', documentRoutes);
router.use('/integrations', integrationRoutes);
router.use('/test', testRoutes);
router.use('/crms', crmRoutes);
router.use('/whatsapp-business', whatsappBusinessRoutes);

module.exports = router;