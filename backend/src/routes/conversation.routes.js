const express = require('express');
const router = express.Router();
const { conversationController } = require('../controllers/conversation.controller');
const { validateRequest } = require('../middlewares/validation');

// **Endpoints de Conversas Dify Completos**

// Lista conversas com dados do Dify integrados
router.get('/', conversationController.getConversations);

// Obtém histórico completo de mensagens de uma conversa (local + Dify)
router.get('/:id/messages', conversationController.getConversationMessages);

// Envia mensagem para conversa (simula mensagem do usuário)
router.post('/:id/messages', validateRequest({
  body: {
    type: 'object',
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 5000 },
      role: { type: 'string', enum: ['user', 'assistant'] },
      audio: { type: 'string' }, // base64 audio data
      mimetype: { type: 'string' } // audio mimetype
    },
    anyOf: [
      { required: ['content', 'role'] },
      { required: ['audio', 'mimetype', 'role'] }
    ]
  }
}), conversationController.sendMessage);

// Deleta conversa (local e Dify)
router.delete('/:id', conversationController.deleteConversation);

// Renomeia conversa (local e Dify)
router.put('/:id/name', validateRequest({
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      auto_generate: { type: 'boolean' }
    },
    anyOf: [
      { required: ['name'] },
      { required: ['auto_generate'] }
    ]
  }
}), conversationController.renameConversation);

// Para geração de mensagem em streaming
router.post('/:id/stop', validateRequest({
  body: {
    type: 'object',
    required: ['task_id'],
    properties: {
      task_id: { type: 'string', minLength: 1 }
    }
  }
}), conversationController.stopMessageGeneration);

// **Endpoints de Feedback de Mensagens**

// Submete feedback (like/dislike) para uma mensagem
router.post('/messages/:messageId/feedback', validateRequest({
  body: {
    type: 'object',
    required: ['rating'],
    properties: {
      rating: { 
        type: ['string', 'null'],
        enum: ['like', 'dislike', null]
      }
    }
  }
}), conversationController.submitMessageFeedback);

module.exports = router;