const Joi = require('joi');
const { logger } = require('../config/logger');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error:', error.details);
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  createCompany: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    plan: Joi.string().valid('basic', 'pro', 'enterprise').default('basic')
  }),

  updateCompany: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    plan: Joi.string().valid('basic', 'pro', 'enterprise').optional(),
    features: Joi.object({
      voice_enabled: Joi.boolean().optional(),
      calendar_enabled: Joi.boolean().optional(),
      crm_enabled: Joi.boolean().optional()
    }).optional(),
    voice_config: Joi.object({
      voiceId: Joi.string().optional(),
      stability: Joi.number().min(0).max(1).optional(),
      similarity: Joi.number().min(0).max(1).optional()
    }).optional()
  }),

  createIntegration: Joi.object({
    company_id: Joi.string().uuid().required(),
    tool_name: Joi.string().min(2).max(100).required(),
    tool_type: Joi.string().valid('calendar', 'crm', 'custom').required(),
    credentials: Joi.object().optional(),
    custom_config: Joi.object().optional()
  }),

  updateConversationStatus: Joi.object({
    status: Joi.string().valid('active', 'archived').required()
  }),

  difyToolCallback: Joi.object({
    action: Joi.string().required(),
    parameters: Joi.object().required(),
    callbackId: Joi.string().required()
  })
};

module.exports = {
  validateRequest,
  schemas
};