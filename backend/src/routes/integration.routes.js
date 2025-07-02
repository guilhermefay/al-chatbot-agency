const express = require('express');
const router = express.Router();
const { integrationController } = require('../controllers/integration.controller');

// Integration routes
router.get('/', integrationController.getIntegrations);
router.post('/', integrationController.createIntegration);
router.put('/:id', integrationController.updateIntegration);
router.delete('/:id', integrationController.deleteIntegration);
router.post('/:id/test', integrationController.testIntegration);

module.exports = router;