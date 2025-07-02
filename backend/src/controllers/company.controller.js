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

  async getWhatsAppSession(req, res) {
    try {
      const { id } = req.params;

      // Buscar a sessão mais recente ao invés de usar .single()
      const { data: sessions } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!sessions || sessions.length === 0) {
        return res.status(404).json({ 
          error: 'WhatsApp session not found',
          hasSession: false 
        });
      }

      const session = sessions[0]; // Pega a mais recente

      res.json({
        session,
        hasSession: true,
        status: session.status
      });
    } catch (error) {
      logger.error('Error getting WhatsApp session:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp session' });
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
      res.status(500).json({ 
        error: 'Failed to create WhatsApp session',
        details: error.message,
        stack: error.stack?.substring(0, 500)
      });
    }
  },

  async getWhatsAppStatus(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 DEBUG: Getting WhatsApp status for company:', id);

      // Buscar a sessão mais recente ao invés de usar .single() - FIXED v2
      const { data: sessions } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!sessions || sessions.length === 0) {
        console.log('❌ DEBUG: No WhatsApp session found');
        return res.status(404).json({ error: 'WhatsApp session not found' });
      }

      const session = sessions[0]; // Pega a mais recente
      console.log('📋 DEBUG: Session found:', session.evolution_instance);

      // Get status with QR code from Evolution API using the new method
      const statusData = await evolutionService.getInstanceStatusWithQR(session.evolution_instance);
      console.log('📡 DEBUG: Evolution API response:', statusData);

      // Update status in database
      const connectionState = statusData.instance?.state || 'disconnected';
      await supabase
        .from('whatsapp_sessions')
        .update({
          status: connectionState,
          phone_number: statusData.instance?.profileName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      console.log('✅ DEBUG: Status updated in database:', connectionState);

      res.json({
        status: connectionState,
        phone_number: statusData.instance?.profileName || null,
        qr_code: statusData.qr_code || null,
        session_id: session.id,
        instance_name: session.evolution_instance,
        raw_status: statusData // Para debug
      });
    } catch (error) {
      console.log('💥 DEBUG: Error in getWhatsAppStatus:', error);
      logger.error('Error getting WhatsApp status:', error);
      res.status(500).json({ 
        error: 'Failed to get WhatsApp status',
        details: error.message 
      });
    }
  },

  /**
   * Conecta WhatsApp diretamente com QR code instantâneo
   * POST /api/companies/:id/whatsapp/connect
   */
  async connectWhatsAppInstant(req, res) {
    try {
      const { id } = req.params;
      console.log('🚀 DEBUG: Instant WhatsApp connect for company:', id);

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

      // Verificar se já existe sessão (buscar a mais recente)
      const { data: existingSessions } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      const existingSession = existingSessions && existingSessions.length > 0 ? existingSessions[0] : null;

      let instanceName;
      let sessionData;

      if (existingSession) {
        console.log('♻️  DEBUG: Using existing session:', existingSession.evolution_instance);
        instanceName = existingSession.evolution_instance;
        sessionData = existingSession;
      } else {
        // Generate unique instance name
        instanceName = `company_${id}_${Date.now()}`;
        console.log('🏷️ DEBUG: Creating new instance:', instanceName);

        // Create instance in Evolution API
        const evolutionInstance = await evolutionService.createInstance(instanceName, id);
        console.log('📡 DEBUG: Evolution instance created:', evolutionInstance);

        // Save session in database
        const { data: newSession, error } = await supabase
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

        sessionData = newSession;
        console.log('✅ DEBUG: Session saved:', sessionData.id);
      }

      // Tentar conectar e obter QR code
      console.log('🔗 DEBUG: Getting QR code...');
      let qrCodeData = null;
      
      try {
        const connectResponse = await evolutionService.connectInstance(instanceName);
        console.log('📱 DEBUG: Connect response:', connectResponse);
        qrCodeData = connectResponse.qrcode || connectResponse.base64 || null;
      } catch (connectError) {
        console.log('⚠️  DEBUG: Connect error, trying status...', connectError.message);
        
        // Se connect falhar, tenta status
        try {
          const statusData = await evolutionService.getInstanceStatusWithQR(instanceName);
          qrCodeData = statusData.qr_code || null;
        } catch (statusError) {
          console.log('⚠️  DEBUG: Status error:', statusError.message);
        }
      }

      // Retornar resultado
      res.json({
        success: true,
        session: sessionData,
        qr_code: qrCodeData,
        instance_name: instanceName,
        message: qrCodeData 
          ? 'QR Code disponível! Escaneie para conectar.' 
          : 'Sessão criada. QR Code pode estar sendo gerado...',
        company: {
          id: company.id,
          name: company.name
        }
      });

      logger.info(`WhatsApp instant connect completed for company: ${id}`);
    } catch (error) {
      console.log('💥 DEBUG: Error in connectWhatsAppInstant:', error);
      logger.error('Error in instant WhatsApp connect:', error);
      res.status(500).json({ 
        error: 'Failed to connect WhatsApp instantly',
        details: error.message,
        stack: error.stack?.substring(0, 500)
      });
    }
  }
};

module.exports = { companyController };