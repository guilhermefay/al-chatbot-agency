const express = require('express');
const router = express.Router();
const { companyController } = require('../controllers/company.controller');
const { validateRequest, schemas } = require('../middlewares/validation');
const { strictLimiter, defaultLimiter } = require('../middlewares/rateLimiter');

// CRUD routes for companies
router.post('/', validateRequest(schemas.createCompany), companyController.createCompany);
router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);
router.put('/:id', validateRequest(schemas.updateCompany), companyController.updateCompany);
router.delete('/:id', strictLimiter, companyController.deleteCompany);

// WhatsApp session management - usando defaultLimiter em vez de strictLimiter
router.get('/:id/whatsapp', companyController.getWhatsAppSession);
router.post('/:id/whatsapp', defaultLimiter, companyController.createWhatsAppSession);
router.get('/:id/whatsapp/status', companyController.getWhatsAppStatus);
// Nova rota para conexão instantânea com QR code
router.post('/:id/whatsapp/connect', companyController.connectWhatsAppInstant);

module.exports = router;