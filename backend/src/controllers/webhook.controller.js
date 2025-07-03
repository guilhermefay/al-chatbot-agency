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
  },

  async handleDifyFunctionCall(req, res) {
    try {
      const { companyId } = req.params;
      const { function_name, arguments: functionArgs, call_id } = req.body;

      logger.info(`Dify function call: ${function_name} for company ${companyId}`);

      const { supabase } = require('../config/supabase');
      
      // Get company and tool configurations
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*, tools_config(*)')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Find the appropriate tool configuration for this function
      const toolConfig = company.tools_config.find(tool => 
        tool.enabled && tool.tool_name === function_name
      );

      if (!toolConfig) {
        return res.status(400).json({ 
          error: `Function ${function_name} not enabled for this company` 
        });
      }

      // Execute the function
      let result;
      switch (function_name) {
        case 'google_calendar':
          result = await this.executeCalendarFunction(functionArgs, toolConfig);
          break;
        case 'crm':
          result = await this.executeCrmFunction(functionArgs, toolConfig);
          break;
        case 'send_email':
          result = await this.executeEmailFunction(functionArgs, toolConfig);
          break;
        default:
          return res.status(400).json({ error: `Unknown function: ${function_name}` });
      }

      // Log the function call
      await supabase
        .from('function_call_logs')
        .insert({
          company_id: companyId,
          function_name,
          arguments: functionArgs,
          result,
          call_id,
          executed_at: new Date().toISOString()
        });

      res.status(200).json({
        call_id,
        result
      });

    } catch (error) {
      logger.error('Dify function call error:', error);
      res.status(500).json({ error: 'Function execution failed' });
    }
  },

  async executeCalendarFunction(args, toolConfig) {
    const { googleCalendarService } = require('../services/integrations/googleCalendar.service');
    const credentials = toolConfig.config;

    const { action, ...params } = args;

    switch (action) {
      case 'check_availability':
        return await googleCalendarService.checkAvailability(credentials, params.date, params.duration);
      case 'create_event':
        return await googleCalendarService.createEvent(credentials, params);
      case 'list_events':
        return await googleCalendarService.listEvents(credentials, params.date);
      default:
        throw new Error(`Unknown calendar action: ${action}`);
    }
  },

  async executeCrmFunction(args, toolConfig) {
    const { crmService } = require('../services/integrations/crm.service');
    const credentials = toolConfig.config;

    const { action, ...params } = args;

    switch (action) {
      case 'create_lead':
        return await crmService.createLead(toolConfig.crm_type, credentials, params);
      case 'update_contact':
        return await crmService.updateContact(toolConfig.crm_type, credentials, params);
      case 'search_contact':
        return await crmService.searchContact(toolConfig.crm_type, credentials, params.query);
      default:
        throw new Error(`Unknown CRM action: ${action}`);
    }
  },

  async executeEmailFunction(args, toolConfig) {
    // Placeholder for email functionality
    logger.info('Email function called:', args);
    return {
      success: true,
      message: 'Email functionality not yet implemented',
      sent: false
    };
  }
};

module.exports = { webhookController };