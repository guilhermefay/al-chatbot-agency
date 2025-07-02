const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { difyService } = require('../services/dify.service');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  }
});

const documentController = {
  uploadMiddleware: upload.single('document'),

  async uploadDocument(req, res) {
    try {
      const { company_id } = req.body;
      const file = req.file;

      if (!file || !company_id) {
        return res.status(400).json({ error: 'File and company_id are required' });
      }

      // Check if company exists
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single();

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Upload file to Supabase Storage
      const fileName = `${company_id}/${Date.now()}-${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Upload to Dify for training
      let difyDocumentId = null;
      try {
        const difyResponse = await difyService.uploadDocument(company.dify_app_id, {
          file: file.buffer,
          name: file.originalname
        });
        difyDocumentId = difyResponse.id;
      } catch (difyError) {
        logger.warn('Failed to upload to Dify:', difyError);
      }

      // Save document metadata to database
      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          company_id,
          name: file.originalname,
          type: file.mimetype,
          url: urlData.publicUrl,
          dify_document_id: difyDocumentId,
          metadata: {
            size: file.size,
            original_name: file.originalname
          }
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Document uploaded for company ${company_id}: ${document.id}`);
      res.status(201).json(document);
    } catch (error) {
      logger.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  },

  async getDocuments(req, res) {
    try {
      const { company_id, page = 1, limit = 20, type, search } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('documents')
        .select('*, companies(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (company_id) {
        query = query.eq('company_id', company_id);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data: documents, error, count } = await query;

      if (error) throw error;

      res.json({
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  },

  /**
   * Lista datasets/bases de conhecimento de uma empresa
   * GET /api/documents/datasets
   */
  async getDatasets(req, res) {
    try {
      const { company_id, page = 1, limit = 20 } = req.query;

      if (!company_id) {
        return res.status(400).json({ error: 'company_id é obrigatório' });
      }

      // Buscar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, dify_api_key')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      if (!company.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Buscar datasets do Dify
      const difyDatasets = await difyService.getDatasets(
        company.dify_api_key,
        parseInt(page),
        parseInt(limit)
      );

      // Buscar documentos locais para cada dataset
      const enrichedDatasets = [];
      
      for (const dataset of difyDatasets.data || []) {
        const { data: localDocs } = await supabase
          .from('documents')
          .select('id, name, type, created_at, metadata')
          .eq('company_id', company_id)
          .like('metadata->dify_dataset_id', dataset.id);

        enrichedDatasets.push({
          ...dataset,
          local_documents: localDocs || []
        });
      }

      res.json({
        success: true,
        data: enrichedDatasets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: difyDatasets.total || 0,
          has_more: difyDatasets.has_more || false
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar datasets:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Cria novo dataset/base de conhecimento
   * POST /api/documents/datasets
   */
  async createDataset(req, res) {
    try {
      const { company_id, name, permission = 'only_me' } = req.body;

      if (!company_id || !name) {
        return res.status(400).json({ error: 'company_id e name são obrigatórios' });
      }

      // Buscar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, dify_api_key')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      if (!company.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Criar dataset no Dify
      const difyDataset = await difyService.createDataset(
        company.dify_api_key,
        name,
        permission
      );

      logger.info(`Dataset criado no Dify para empresa ${company_id}: ${difyDataset.id}`);
      
      res.status(201).json({
        success: true,
        data: difyDataset
      });

    } catch (error) {
      logger.error('Erro ao criar dataset:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Deleta documento específico de um dataset
   * DELETE /api/documents/:id/from-dataset
   */
  async deleteDocumentFromDataset(req, res) {
    try {
      const { id } = req.params;
      const { dataset_id } = req.body;

      if (!dataset_id) {
        return res.status(400).json({ error: 'dataset_id é obrigatório' });
      }

      // Buscar documento
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*, companies(dify_api_key)')
        .eq('id', id)
        .single();

      if (docError || !document) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      if (!document.companies.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Deletar do dataset no Dify
      if (document.dify_document_id) {
        try {
          await difyService.deleteDocument(
            document.companies.dify_api_key,
            dataset_id,
            document.dify_document_id
          );
          logger.info(`Documento deletado do dataset Dify: ${document.dify_document_id}`);
        } catch (difyError) {
          logger.warn('Erro ao deletar documento do Dify:', difyError);
          return res.status(500).json({ error: 'Erro ao deletar documento do Dify' });
        }
      }

      res.json({
        success: true,
        message: 'Documento removido do dataset com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao deletar documento do dataset:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async getDocumentStats(req, res) {
    try {
      const { company_id } = req.query;

      let baseQuery = supabase.from('documents');

      if (company_id) {
        baseQuery = baseQuery.eq('company_id', company_id);
      }

      // Get total documents
      const { count: totalDocuments } = await baseQuery
        .select('*', { count: 'exact', head: true });

      // Get documents by type
      const { data: typeStats } = await baseQuery
        .select('type')
        .then(({ data }) => {
          const stats = {};
          data?.forEach(doc => {
            const type = doc.type || 'unknown';
            stats[type] = (stats[type] || 0) + 1;
          });
          return { data: stats };
        });

      // Get today's uploads
      const today = new Date().toISOString().split('T')[0];
      const { count: todayUploads } = await baseQuery
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get documents with Dify integration
      const { count: difyIntegrated } = await baseQuery
        .select('*', { count: 'exact', head: true })
        .not('dify_document_id', 'is', null);

      res.json({
        total: totalDocuments || 0,
        today: todayUploads || 0,
        dify_integrated: difyIntegrated || 0,
        by_type: typeStats || {},
        integration_rate: totalDocuments > 0 ? ((difyIntegrated || 0) / totalDocuments * 100).toFixed(1) : 0
      });
    } catch (error) {
      logger.error('Error fetching document stats:', error);
      res.status(500).json({ error: 'Failed to fetch document stats' });
    }
  },

  async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      // Get document info
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete from Supabase Storage
      if (document.url) {
        const fileName = document.url.split('/').pop();
        await supabase.storage
          .from('documents')
          .remove([`${document.company_id}/${fileName}`]);
      }

      // Delete from Dify (if exists)
      if (document.dify_document_id) {
        try {
          // TODO: Implement Dify document deletion API call
          logger.info(`Should delete Dify document: ${document.dify_document_id}`);
        } catch (difyError) {
          logger.warn('Failed to delete from Dify:', difyError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info(`Document deleted: ${id}`);
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      logger.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  },

  /**
   * Busca documentos em um dataset específico
   * GET /api/documents/datasets/:datasetId/documents
   */
  async getDatasetDocuments(req, res) {
    try {
      const { datasetId } = req.params;
      const { company_id, page = 1, limit = 20 } = req.query;

      if (!company_id) {
        return res.status(400).json({ error: 'company_id é obrigatório' });
      }

      // Buscar documentos locais relacionados ao dataset
      const { data: documents, error, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('company_id', company_id)
        .like('metadata->dify_dataset_id', datasetId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: documents || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar documentos do dataset:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Upload documento para dataset específico
   * POST /api/documents/datasets/:datasetId/upload
   */
  async uploadToDataset(req, res) {
    try {
      const { datasetId } = req.params;
      const { company_id } = req.body;
      const file = req.file;

      if (!file || !company_id) {
        return res.status(400).json({ error: 'File and company_id são obrigatórios' });
      }

      // Buscar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, dify_api_key')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      if (!company.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Upload para Supabase Storage
      const fileName = `${company_id}/${datasetId}/${Date.now()}-${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Upload para dataset específico no Dify
      let difyDocumentId = null;
      try {
        const difyResponse = await difyService.uploadDocument(datasetId, {
          file: file.buffer,
          name: file.originalname
        });
        difyDocumentId = difyResponse.id;
      } catch (difyError) {
        logger.error('Erro ao fazer upload para Dify:', difyError);
        return res.status(500).json({ error: 'Erro ao fazer upload para Dify' });
      }

      // Salvar metadata no banco
      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          company_id,
          name: file.originalname,
          type: file.mimetype,
          url: urlData.publicUrl,
          dify_document_id: difyDocumentId,
          metadata: {
            size: file.size,
            original_name: file.originalname,
            dify_dataset_id: datasetId
          }
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Documento enviado para dataset ${datasetId}: ${document.id}`);
      
      res.status(201).json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Erro ao fazer upload para dataset:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = { documentController };