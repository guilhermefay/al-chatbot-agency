const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { googleCalendarService } = require('./integrations/googleCalendar.service');
const { crmService } = require('./integrations/crm.service');

const toolService = {
  async executeToolAction(toolId, action, parameters) {
    try {
      logger.info(`Executing tool action: ${toolId} - ${action}`);

      // Get tool configuration
      const { data: toolConfig } = await supabase
        .from('tools_config')
        .select('*')
        .eq('tool_id', toolId)
        .single();

      if (!toolConfig) {
        throw new Error(`Tool configuration not found: ${toolId}`);
      }

      // Route to appropriate service based on tool type
      switch (toolConfig.tool_type) {
        case 'calendar':
          return await this.handleCalendarAction(action, parameters, toolConfig);
        
        case 'crm':
          return await this.handleCrmAction(action, parameters, toolConfig);
        
        case 'custom':
          return await this.handleCustomAction(action, parameters, toolConfig);
        
        default:
          throw new Error(`Unknown tool type: ${toolConfig.tool_type}`);
      }
    } catch (error) {
      logger.error('Tool execution error:', error);
      throw error;
    }
  },

  async handleCalendarAction(action, parameters, config) {
    const credentials = JSON.parse(config.credentials);
    
    switch (action) {
      case 'check_availability':
        return await googleCalendarService.checkAvailability(
          credentials,
          parameters.date,
          parameters.duration
        );
      
      case 'create_event':
        return await googleCalendarService.createEvent(
          credentials,
          parameters
        );
      
      case 'list_events':
        return await googleCalendarService.listEvents(
          credentials,
          parameters.date
        );
      
      default:
        throw new Error(`Unknown calendar action: ${action}`);
    }
  },

  async handleCrmAction(action, parameters, config) {
    const credentials = JSON.parse(config.credentials);
    
    switch (action) {
      case 'create_lead':
        return await crmService.createLead(
          config.crm_type,
          credentials,
          parameters
        );
      
      case 'update_contact':
        return await crmService.updateContact(
          config.crm_type,
          credentials,
          parameters
        );
      
      case 'search_contact':
        return await crmService.searchContact(
          config.crm_type,
          credentials,
          parameters.query
        );
      
      default:
        throw new Error(`Unknown CRM action: ${action}`);
    }
  },

  async handleCustomAction(action, parameters, config) {
    // Execute custom webhook or API call
    const customConfig = JSON.parse(config.custom_config);
    
    // Implementation depends on custom tool configuration
    logger.info(`Executing custom action: ${action}`);
    
    return {
      success: true,
      action,
      parameters
    };
  }
};

module.exports = { toolService };