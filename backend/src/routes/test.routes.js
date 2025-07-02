const express = require('express');
const router = express.Router();
const { difyService } = require('../services/dify.service');
const { logger } = require('../config/logger');

/**
 * Testa conectividade com API do Dify
 */
router.post('/dify-connection', async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({
        success: false,
        error: 'API key é obrigatória'
      });
    }

    // Teste básico: tentar enviar uma mensagem simples
    const testMessage = "Olá! Este é um teste de conectividade.";
    const testUserId = "test-connection-" + Date.now();

    const response = await difyService.sendMessage(
      testMessage,
      testUserId,
      api_key
    );

    // Se chegou até aqui, a conexão funcionou
    res.json({
      success: true,
      message: 'Conexão com Dify estabelecida com sucesso!',
      data: {
        conversation_id: response.conversation_id,
        message_id: response.message_id,
        response_preview: response.answer ? response.answer.substring(0, 100) + '...' : 'Sem resposta'
      }
    });

  } catch (error) {
    logger.error('Erro ao testar conexão Dify:', error);
    
    // Interpretar diferentes tipos de erro
    let errorMessage = 'Erro desconhecido na conexão';
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMessage = 'API key inválida ou expirada';
      } else if (status === 403) {
        errorMessage = 'Acesso negado - verifique permissões da API key';
      } else if (status === 404) {
        errorMessage = 'App não encontrado - verifique se a API key está correta';
      } else if (status >= 500) {
        errorMessage = 'Erro no servidor do Dify - tente novamente em alguns minutos';
      } else {
        errorMessage = `Erro HTTP ${status}: ${error.response.data?.message || 'Erro na requisição'}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Não foi possível conectar ao Dify - verifique sua conexão';
    } else if (error.code === 'TIMEOUT') {
      errorMessage = 'Timeout na conexão - o Dify pode estar sobrecarregado';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Testa configuração completa de uma empresa
 */
router.post('/company-setup/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const supabase = req.supabase;

    // Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        success: false,
        error: 'Empresa não encontrada'
      });
    }

    const tests = {
      dify: { status: 'pending', message: '' },
      whatsapp: { status: 'pending', message: '' },
      database: { status: 'success', message: 'Conectado com sucesso' }
    };

    // Teste Dify
    if (company.dify_api_key) {
      try {
        const testResponse = await difyService.sendMessage(
          "Teste de conectividade",
          `test-${Date.now()}`,
          company.dify_api_key
        );
        tests.dify = {
          status: 'success',
          message: 'API Dify funcionando corretamente',
          conversation_id: testResponse.conversation_id
        };
      } catch (error) {
        tests.dify = {
          status: 'error',
          message: 'Erro na conexão com Dify: ' + error.message
        };
      }
    } else {
      tests.dify = {
        status: 'warning',
        message: 'API key do Dify não configurada'
      };
    }

    // Teste WhatsApp (verificar se existe sessão)
    const { data: whatsappSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (whatsappSession) {
      tests.whatsapp = {
        status: whatsappSession.status === 'connected' ? 'success' : 'warning',
        message: whatsappSession.status === 'connected' 
          ? 'WhatsApp conectado e funcionando' 
          : `WhatsApp ${whatsappSession.status} - instância: ${whatsappSession.evolution_instance}`
      };
    } else {
      tests.whatsapp = {
        status: 'warning',
        message: 'Instância WhatsApp não configurada'
      };
    }

    res.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan
      },
      tests
    });

  } catch (error) {
    logger.error('Erro ao testar configuração da empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 