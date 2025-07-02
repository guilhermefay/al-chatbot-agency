const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { evolutionService } = require('../services/evolution.service');
const { difyService } = require('../services/dify.service');
const { v4: uuidv4 } = require('uuid');

const companyController = {
  async createCompany(req, res) {
    try {
      const { name, email, phone, plan = 'basic' } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Create Dify app
      const difyApp = await difyService.createApp({
        name: `${name} Chatbot`,
        systemPrompt: `Você é um assistente virtual da empresa ${name}. Seja sempre prestativo e profissional.`,
        openingStatement: `Olá! Sou o assistente virtual da ${name}. Como posso ajudá-lo hoje?`
      });

      // Create company in database
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          name,
          email,
          phone,
          plan,
          dify_app_id: difyApp.id,
          status: 'active',
          features: {
            voice_enabled: false,
            calendar_enabled: false,
            crm_enabled: false
          }
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Company created: ${company.id}`);
      res.status(201).json(company);
    } catch (error) {
      logger.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  },

  async getCompanies(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('companies')
        .select('*, whatsapp_sessions(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: companies, error, count } = await query;

      if (error) throw error;

      res.json({
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  },

  async getCompany(req, res) {
    try {
      const { id } = req.params;

      const { data: company, error } = await supabase
        .from('companies')
        .select('*, whatsapp_sessions(*), tools_config(*)')
        .eq('id', id)
        .single();

      if (error || !company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(company);
    } catch (error) {
      logger.error('Error fetching company:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  },

  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, plan, features, voice_config } = req.body;

      const { data: company, error } = await supabase
        .from('companies')
        .update({
          name,
          email,
          phone,
          plan,
          features,
          voice_config,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      logger.info(`Company updated: ${id}`);
      res.json(company);
    } catch (error) {
      logger.error('Error updating company:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  },

  async deleteCompany(req, res) {
    try {
      const { id } = req.params;

      // Get company with WhatsApp sessions
      const { data: company } = await supabase
        .from('companies')
        .select('*, whatsapp_sessions(*)')
        .eq('id', id)
        .single();

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Delete WhatsApp sessions from Evolution API
      for (const session of company.whatsapp_sessions) {
        try {
          await evolutionService.deleteInstance(session.evolution_instance);
        } catch (error) {
          logger.warn(`Failed to delete Evolution instance: ${session.evolution_instance}`);
        }
      }

      // Delete company (cascade will handle related records)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info(`Company deleted: ${id}`);
      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      logger.error('Error deleting company:', error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  },

  async createWhatsAppSession(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 DEBUG: Creating WhatsApp session for company:', id);

      // Check if company exists
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (!company) {
        console.log('❌ DEBUG: Company not found:', id);
        return res.status(404).json({ error: 'Company not found' });
      }

      console.log('✅ DEBUG: Company found:', company.name);

      // Generate unique instance name
      const instanceName = `company_${id}_${Date.now()}`;
      console.log('🏷️ DEBUG: Instance name:', instanceName);

      // Create instance in Evolution API
      console.log('🚀 DEBUG: Calling Evolution API createInstance...');
      const evolutionInstance = await evolutionService.createInstance(instanceName, id);
      console.log('📡 DEBUG: Evolution API response:', evolutionInstance);

      // Save session in database
      console.log('💾 DEBUG: Saving session to database...');
      const { data: session, error } = await supabase
        .from('whatsapp_sessions')
        .insert({
          company_id: id,
          evolution_instance: instanceName,
          status: 'disconnected',
          webhook_url: evolutionInstance.webhook?.url
        })
        .select()
        .single();

      if (error) {
        console.log('❌ DEBUG: Supabase error:', error);
        throw error;
      }

      console.log('✅ DEBUG: Session saved:', session.id);

      logger.info(`WhatsApp session created for company: ${id}`);
      res.status(201).json({
        session,
        qr_code: evolutionInstance.qrcode
      });
    } catch (error) {
      console.log('💥 DEBUG: Full error details:', error);
      logger.error('Error creating WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to create WhatsApp session' });
    }
  },

  async getWhatsAppStatus(req, res) {
    try {
      const { id } = req.params;

      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('company_id', id)
        .single();

      if (!session) {
        return res.status(404).json({ error: 'WhatsApp session not found' });
      }

      // Get status from Evolution API
      const status = await evolutionService.getInstanceStatus(session.evolution_instance);

      // Update status in database
      await supabase
        .from('whatsapp_sessions')
        .update({
          status: status.instance?.state || 'disconnected',
          phone_number: status.instance?.profilePictureUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      res.json({
        status: status.instance?.state || 'disconnected',
        phone_number: status.instance?.profileName || null,
        qr_code: status.qrcode || null
      });
    } catch (error) {
      logger.error('Error getting WhatsApp status:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp status' });
    }
  }
};

module.exports = { companyController };