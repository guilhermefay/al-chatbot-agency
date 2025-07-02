const express = require('express');
const router = express.Router();
const { companyController } = require('../controllers/company.controller');
const { validateRequest, schemas } = require('../middlewares/validation');
const { strictLimiter } = require('../middlewares/rateLimiter');

// CRUD routes for companies
router.post('/', validateRequest(schemas.createCompany), companyController.createCompany);
router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);
router.put('/:id', validateRequest(schemas.updateCompany), companyController.updateCompany);
router.delete('/:id', strictLimiter, companyController.deleteCompany);

// WhatsApp session management
router.get('/:id/whatsapp', companyController.getWhatsAppSession);
router.post('/:id/whatsapp', strictLimiter, companyController.createWhatsAppSession);
router.get('/:id/whatsapp/status', companyController.getWhatsAppStatus);

module.exports = router;