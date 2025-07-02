const { logger } = require('../config/logger');
const { messageService } = require('../services/message.service');
const { toolService } = require('../services/tool.service');

const webhookController = {
  async handleEvolutionWebhook(req, res) {
    try {
      const { instanceId } = req.params;
      const { event, data } = req.body;

      logger.info(`Evolution webhook received: ${event} for instance ${instanceId}`);

      // Handle different Evolution events
      switch (event) {
        case 'messages.upsert':
          await messageService.handleIncomingMessage(instanceId, data);
          break;
        
        case 'connection.update':
          logger.info(`Connection update for ${instanceId}: ${data.state}`);
          break;
        
        default:
          logger.debug(`Unhandled event: ${event}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Evolution webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async handleDifyToolCallback(req, res) {
    try {
      const { toolId } = req.params;
      const { action, parameters, callbackId } = req.body;

      logger.info(`Dify tool callback: ${toolId} - ${action}`);

      const result = await toolService.executeToolAction(toolId, action, parameters);

      res.status(200).json({
        callbackId,
        result
      });
    } catch (error) {
      logger.error('Dify tool callback error:', error);
      res.status(500).json({ error: 'Tool execution failed' });
    }
  }
};

module.exports = { webhookController };