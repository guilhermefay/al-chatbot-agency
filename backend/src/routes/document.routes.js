const express = require('express');
const router = express.Router();
const { documentController } = require('../controllers/document.controller');
const { validateRequest } = require('../middlewares/validation');

// **Endpoints de Documentos Básicos**

// Upload de documento
router.post('/upload', 
  documentController.uploadMiddleware, 
  documentController.uploadDocument
);

// Lista documentos com filtros
router.get('/', documentController.getDocuments);

// Estatísticas de documentos
router.get('/stats', documentController.getDocumentStats);

// Deleta documento
router.delete('/:id', documentController.deleteDocument);

// **Endpoints de Datasets/Bases de Conhecimento Dify**

// Lista datasets de uma empresa
router.get('/datasets', validateRequest({
  query: {
    type: 'object',
    required: ['company_id'],
    properties: {
      company_id: { type: 'string', format: 'uuid' },
      page: { type: 'string', pattern: '^[1-9]\\d*$' },
      limit: { type: 'string', pattern: '^[1-9]\\d*$' }
    }
  }
}), documentController.getDatasets);

// Cria novo dataset
router.post('/datasets', validateRequest({
  body: {
    type: 'object',
    required: ['company_id', 'name'],
    properties: {
      company_id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      permission: { 
        type: 'string',
        enum: ['only_me', 'all_team_members', 'partial_members']
      }
    }
  }
}), documentController.createDataset);

// Lista documentos de um dataset específico
router.get('/datasets/:datasetId/documents', validateRequest({
  params: {
    type: 'object',
    required: ['datasetId'],
    properties: {
      datasetId: { type: 'string', minLength: 1 }
    }
  },
  query: {
    type: 'object',
    required: ['company_id'],
    properties: {
      company_id: { type: 'string', format: 'uuid' },
      page: { type: 'string', pattern: '^[1-9]\\d*$' },
      limit: { type: 'string', pattern: '^[1-9]\\d*$' }
    }
  }
}), documentController.getDatasetDocuments);

// Upload documento para dataset específico
router.post('/datasets/:datasetId/upload',
  documentController.uploadMiddleware,
  validateRequest({
    params: {
      type: 'object',
      required: ['datasetId'],
      properties: {
        datasetId: { type: 'string', minLength: 1 }
      }
    }
  }),
  documentController.uploadToDataset
);

// **Endpoints de Gerenciamento de Documentos em Datasets**

// Remove documento de dataset específico (mantém arquivo local)
router.delete('/:id/from-dataset', validateRequest({
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['dataset_id'],
    properties: {
      dataset_id: { type: 'string', minLength: 1 }
    }
  }
}), documentController.deleteDocumentFromDataset);

module.exports = router;