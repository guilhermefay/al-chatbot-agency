const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { toolService } = require('../services/tool.service');

const integrationController = {
  async getIntegrations(req, res) {
    try {
      const { company_id } = req.query;

      let query = supabase
        .from('tools_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (company_id) {
        query = query.eq('company_id', company_id);
      }

      const { data: integrations, error } = await query;

      if (error) throw error;

      // Don't expose sensitive credentials in response
      const sanitizedIntegrations = integrations.map(integration => ({
        ...integration,
        credentials: integration.credentials ? '***' : null
      }));

      res.json(sanitizedIntegrations);
    } catch (error) {
      logger.error('Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  },

  async createIntegration(req, res) {
    try {
      const { 
        company_id, 
        tool_name, 
        tool_type, 
        credentials, 
        custom_config 
      } = req.body;

      // Validate required fields
      if (!company_id || !tool_name || !tool_type) {
        return res.status(400).json({ 
          error: 'company_id, tool_name, and tool_type are required' 
        });
      }

      // Check if company exists
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .single();

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Generate unique tool_id
      const tool_id = `${tool_type}_${company_id}_${Date.now()}`;

      // Encrypt credentials (in production, use proper encryption)
      const encryptedCredentials = credentials ? JSON.stringify(credentials) : null;

      // Create integration
      const { data: integration, error } = await supabase
        .from('tools_config')
        .insert({
          company_id,
          tool_id,
          tool_name,
          tool_type,
          enabled: true,
          credentials: encryptedCredentials,
          custom_config: custom_config || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Create tool in Dify if needed
      try {
        if (['calendar', 'crm'].includes(tool_type)) {
          const toolConfig = {
            id: tool_id,
            name: tool_name,
            description: `Integration with ${tool_type} for ${tool_name}`,
            parameters: this.getToolParameters(tool_type)
          };
          
          await difyService.createTool(toolConfig);
        }
      } catch (difyError) {
        logger.warn('Failed to create tool in Dify:', difyError);
      }

      logger.info(`Integration created: ${integration.id}`);
      
      // Return without sensitive data
      const response = { ...integration };
      delete response.credentials;
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating integration:', error);
      res.status(500).json({ error: 'Failed to create integration' });
    }
  },

  async updateIntegration(req, res) {
    try {
      const { id } = req.params;
      const { tool_name, enabled, credentials, custom_config } = req.body;

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (tool_name !== undefined) updateData.tool_name = tool_name;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (credentials !== undefined) {
        updateData.credentials = credentials ? JSON.stringify(credentials) : null;
      }
      if (custom_config !== undefined) updateData.custom_config = custom_config;

      const { data: integration, error } = await supabase
        .from('tools_config')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      logger.info(`Integration updated: ${id}`);
      
      // Return without sensitive data
      const response = { ...integration };
      delete response.credentials;
      
      res.json(response);
    } catch (error) {
      logger.error('Error updating integration:', error);
      res.status(500).json({ error: 'Failed to update integration' });
    }
  },

  async deleteIntegration(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('tools_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info(`Integration deleted: ${id}`);
      res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
      logger.error('Error deleting integration:', error);
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  },

  async testIntegration(req, res) {
    try {
      const { id } = req.params;
      const { test_data } = req.body;

      // Get integration config
      const { data: integration } = await supabase
        .from('tools_config')
        .select('*')
        .eq('id', id)
        .single();

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      // Test the integration based on type
      let result;
      switch (integration.tool_type) {
        case 'calendar':
          result = await toolService.handleCalendarAction(
            'check_availability',
            test_data || { date: new Date().toISOString(), duration: 60 },
            integration
          );
          break;
        
        case 'crm':
          result = await toolService.handleCrmAction(
            'search_contact',
            test_data || { query: 'test' },
            integration
          );
          break;
        
        default:
          result = { success: true, message: 'Integration type not testable' };
      }

      res.json({
        success: true,
        result
      });
    } catch (error) {
      logger.error('Error testing integration:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Integration test failed',
        details: error.message 
      });
    }
  },

  getToolParameters(toolType) {
    switch (toolType) {
      case 'calendar':
        return {
          check_availability: {
            date: { type: 'string', description: 'Date to check availability' },
            duration: { type: 'number', description: 'Duration in minutes' }
          },
          create_event: {
            title: { type: 'string', description: 'Event title' },
            startTime: { type: 'string', description: 'Start time' },
            endTime: { type: 'string', description: 'End time' },
            description: { type: 'string', description: 'Event description' }
          }
        };
      
      case 'crm':
        return {
          create_lead: {
            name: { type: 'string', description: 'Lead name' },
            email: { type: 'string', description: 'Lead email' },
            phone: { type: 'string', description: 'Lead phone' }
          },
          search_contact: {
            query: { type: 'string', description: 'Search query' }
          }
        };
      
      default:
        return {};
    }
  }
};

module.exports = { integrationController };