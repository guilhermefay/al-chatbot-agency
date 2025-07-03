const { logger } = require('../config/logger');

// Estratégias de chunking disponíveis
const CHUNKING_STRATEGIES = {
  NATURAL: 'natural',      // Mais humano, delays variáveis
  EFFICIENT: 'efficient',  // Mais rápido, delays menores
  FORMAL: 'formal'         // Pausas mais longas, mais profissional
};

// Tipos de conteúdo detectados
const CONTENT_TYPES = {
  TEXT: 'text',
  LIST: 'list',
  CODE: 'code',
  QUOTE: 'quote',
  EMPHASIS: 'emphasis'
};

const messageChunkerService = {
  /**
   * Detecta o tipo de conteúdo de uma seção da mensagem
   * @param {string} text - Texto a ser analisado
   * @returns {string} - Tipo de conteúdo detectado
   */
  detectContentType(text) {
    const trimmed = text.trim();
    
    // Detecta código (```code``` ou `code`)
    if (trimmed.includes('```') || (trimmed.includes('`') && trimmed.split('`').length > 2)) {
      return CONTENT_TYPES.CODE;
    }
    
    // Detecta citações (> texto ou "texto")
    if (trimmed.startsWith('>') || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      return CONTENT_TYPES.QUOTE;
    }
    
    // Detecta listas (-, *, 1., etc.)
    if (/^\s*[-*•]\s|^\s*\d+\.\s/m.test(trimmed)) {
      return CONTENT_TYPES.LIST;
    }
    
    // Detecta ênfase (*texto*, _texto_, **texto**)
    if (/\*[^*]+\*|_[^_]+_|\*\*[^*]+\*\*/.test(trimmed)) {
      return CONTENT_TYPES.EMPHASIS;
    }
    
    return CONTENT_TYPES.TEXT;
  },

  /**
   * Quebra uma mensagem longa em pedaços menores de forma inteligente
   * @param {string} message - Mensagem original
   * @param {number} maxLength - Tamanho máximo de cada pedaço (padrão: 280 caracteres)
   * @param {Object} options - Opções { strategy, preserveFormatting }
   * @returns {Object} - { chunks: string[], metadata: Object[] }
   */
  chunkMessage(message, maxLength = 280, options = {}) {
    const { strategy = CHUNKING_STRATEGIES.NATURAL, preserveFormatting = true } = options;
    if (!message || message.length <= maxLength) {
      return {
        chunks: [message],
        metadata: [{ type: CONTENT_TYPES.TEXT, delay: 0 }]
      };
    }

    const chunks = [];
    const metadata = [];
    const paragraphs = message.split('\n\n');
    
    for (const paragraph of paragraphs) {
      const contentType = this.detectContentType(paragraph);
      
      if (paragraph.length <= maxLength) {
        // Parágrafo cabe em um chunk
        const chunk = paragraph.trim();
        chunks.push(chunk);
        metadata.push({
          type: contentType,
          delay: this.calculateSmartDelay(chunk, contentType, strategy)
        });
      } else {
        // Precisa quebrar o parágrafo - estratégia baseada no tipo de conteúdo
        if (contentType === CONTENT_TYPES.LIST) {
          // Para listas, quebra por item
          const items = paragraph.split(/\n(?=\s*[-*•]\s|\s*\d+\.\s)/);
          this.processListItems(items, maxLength, chunks, metadata, strategy);
        } else if (contentType === CONTENT_TYPES.CODE) {
          // Para código, tenta preservar blocos
          this.processCodeBlocks(paragraph, maxLength, chunks, metadata, strategy);
        } else {
          // Para texto normal, quebra por frases
          const sentences = paragraph.split(/(?<=[.!?])\s+/);
          this.processSentences(sentences, maxLength, chunks, metadata, contentType, strategy);
        }
      }
    }
    
    return {
      chunks: chunks.filter(chunk => chunk.length > 0),
      metadata: metadata
    };
  },

  /**
   * Processa itens de lista mantendo contexto
   */
  processListItems(items, maxLength, chunks, metadata, strategy) {
    let currentChunk = '';
    
    for (const item of items) {
      if ((currentChunk + '\n' + item).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          metadata.push({
            type: CONTENT_TYPES.LIST,
            delay: this.calculateSmartDelay(currentChunk, CONTENT_TYPES.LIST, strategy)
          });
          currentChunk = item;
        } else {
          // Item muito grande, força quebra
          chunks.push(item.trim());
          metadata.push({
            type: CONTENT_TYPES.LIST,
            delay: this.calculateSmartDelay(item, CONTENT_TYPES.LIST, strategy)
          });
        }
      } else {
        currentChunk = currentChunk ? currentChunk + '\n' + item : item;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
      metadata.push({
        type: CONTENT_TYPES.LIST,
        delay: this.calculateSmartDelay(currentChunk, CONTENT_TYPES.LIST, strategy)
      });
    }
  },

  /**
   * Processa blocos de código preservando estrutura
   */
  processCodeBlocks(paragraph, maxLength, chunks, metadata, strategy) {
    // Tenta manter blocos de código intactos
    const codeBlockRegex = /```[\s\S]*?```/g;
    const parts = paragraph.split(codeBlockRegex);
    const codeBlocks = paragraph.match(codeBlockRegex) || [];
    
    let blockIndex = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim()) {
        this.processSentences([parts[i]], maxLength, chunks, metadata, CONTENT_TYPES.TEXT, strategy);
      }
      
      if (blockIndex < codeBlocks.length) {
        const block = codeBlocks[blockIndex];
        if (block.length <= maxLength) {
          chunks.push(block);
          metadata.push({
            type: CONTENT_TYPES.CODE,
            delay: this.calculateSmartDelay(block, CONTENT_TYPES.CODE, strategy)
          });
        } else {
          // Código muito grande, quebra por linhas
          const lines = block.split('\n');
          let currentChunk = '';
          
          for (const line of lines) {
            if ((currentChunk + '\n' + line).length > maxLength) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                metadata.push({
                  type: CONTENT_TYPES.CODE,
                  delay: this.calculateSmartDelay(currentChunk, CONTENT_TYPES.CODE, strategy)
                });
                currentChunk = line;
              } else {
                chunks.push(line);
                metadata.push({
                  type: CONTENT_TYPES.CODE,
                  delay: this.calculateSmartDelay(line, CONTENT_TYPES.CODE, strategy)
                });
              }
            } else {
              currentChunk = currentChunk ? currentChunk + '\n' + line : line;
            }
          }
          
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            metadata.push({
              type: CONTENT_TYPES.CODE,
              delay: this.calculateSmartDelay(currentChunk, CONTENT_TYPES.CODE, strategy)
            });
          }
        }
        blockIndex++;
      }
    }
  },

  /**
   * Processa frases normais
   */
  processSentences(sentences, maxLength, chunks, metadata, contentType, strategy) {
    let currentChunk = '';
        
        for (const sentence of sentences) {
        
        for (const sentence of sentences) {
      // Se a frase sozinha já é muito grande, quebra por palavras
      if (sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          metadata.push({
            type: contentType,
            delay: this.calculateSmartDelay(currentChunk, contentType, strategy)
          });
          currentChunk = '';
        }
        
        const words = sentence.split(' ');
        for (const word of words) {
          if ((currentChunk + ' ' + word).length > maxLength) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              metadata.push({
                type: contentType,
                delay: this.calculateSmartDelay(currentChunk, contentType, strategy)
              });
              currentChunk = word;
            } else {
              // Palavra muito grande, força o chunk
              chunks.push(word);
              metadata.push({
                type: contentType,
                delay: this.calculateSmartDelay(word, contentType, strategy)
              });
            }
          } else {
            currentChunk = currentChunk ? currentChunk + ' ' + word : word;
          }
        }
      } else {
        // Tenta adicionar a frase ao chunk atual
        if ((currentChunk + ' ' + sentence).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            metadata.push({
              type: contentType,
              delay: this.calculateSmartDelay(currentChunk, contentType, strategy)
            });
            currentChunk = sentence;
          } else {
            chunks.push(sentence.trim());
            metadata.push({
              type: contentType,
              delay: this.calculateSmartDelay(sentence, contentType, strategy)
            });
          }
        } else {
          currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
      metadata.push({
        type: contentType,
        delay: this.calculateSmartDelay(currentChunk, contentType, strategy)
      });
    }
  },

  /**
   * Calcula delay inteligente baseado no conteúdo e estratégia
   * @param {string} message - Mensagem
   * @param {string} contentType - Tipo de conteúdo
   * @param {string} strategy - Estratégia de chunking
   * @returns {number} - Delay em milissegundos
   */
  calculateSmartDelay(message, contentType = CONTENT_TYPES.TEXT, strategy = CHUNKING_STRATEGIES.NATURAL) {
    const words = message.split(' ').length;
    const chars = message.length;
    
    // Velocidades base por estratégia (WPM)
    const speedSettings = {
      [CHUNKING_STRATEGIES.NATURAL]: {
        baseWPM: 35,
        variance: 10,  // ±10 WPM
        minDelay: 1800,
        maxDelay: 10000
      },
      [CHUNKING_STRATEGIES.EFFICIENT]: {
        baseWPM: 50,
        variance: 5,
        minDelay: 1000,
        maxDelay: 6000
      },
      [CHUNKING_STRATEGIES.FORMAL]: {
        baseWPM: 30,
        variance: 5,
        minDelay: 2500,
        maxDelay: 12000
      }
    };
    
    const settings = speedSettings[strategy];
    
    // Velocidade variável para parecer mais humano
    const wpmVariation = (Math.random() - 0.5) * 2 * settings.variance;
    const actualWPM = settings.baseWPM + wpmVariation;
    
    // Tempo base de digitação
    let typingTime = (words / actualWPM) * 60 * 1000;
    
    // Ajustes por tipo de conteúdo
    const contentMultipliers = {
      [CONTENT_TYPES.TEXT]: 1.0,
      [CONTENT_TYPES.LIST]: 1.2,      // Listas demoram mais para pensar
      [CONTENT_TYPES.CODE]: 1.8,      // Código demora muito mais
      [CONTENT_TYPES.QUOTE]: 1.1,     // Citações são um pouco mais lentas
      [CONTENT_TYPES.EMPHASIS]: 1.05  // Ênfase é ligeiramente mais lenta
    };
    
    typingTime *= contentMultipliers[contentType] || 1.0;
    
    // Pausas extras baseadas na pontuação
    const punctuationDelays = {
      '.': 300,
      '!': 400,
      '?': 350,
      ':': 200,
      ';': 250,
      '\n': 150
    };
    
    let punctuationDelay = 0;
    for (const [punct, delay] of Object.entries(punctuationDelays)) {
      const count = (message.match(new RegExp('\\' + punct, 'g')) || []).length;
      punctuationDelay += count * delay;
    }
    
    // Delay extra para mensagens muito longas (fadiga de digitação)
    const lengthPenalty = chars > 200 ? Math.log(chars / 200) * 500 : 0;
    
    const totalDelay = typingTime + punctuationDelay + lengthPenalty;
    
    return Math.min(Math.max(totalDelay, settings.minDelay), settings.maxDelay);
  },

  /**
   * DEPRECATED: Mantido para compatibilidade
   * @param {string} message - Mensagem
   * @returns {number} - Delay em milissegundos
   */
  calculateTypingDelay(message) {
    return this.calculateSmartDelay(message, CONTENT_TYPES.TEXT, CHUNKING_STRATEGIES.NATURAL);
  },

  /**
   * Envia múltiplas mensagens com delay inteligente entre elas
   * @param {Array} chunks - Array de pedaços de mensagem
   * @param {Function} sendFunction - Função para enviar cada mensagem
   * @param {Object} baseData - Dados base para envio (number, etc)
   * @param {Object} options - Opções avançadas
   */
  async sendChunkedMessages(chunks, sendFunction, baseData, options = {}) {
    const {
      enableTypingIndicator = true,
      customDelay = null,
      strategy = CHUNKING_STRATEGIES.NATURAL,
      metadata = [],
      showProgress = false
    } = options;
    
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkMetadata = metadata[i] || { type: CONTENT_TYPES.TEXT, delay: 0 };
        const isLast = i === chunks.length - 1;
        const isFirst = i === 0;
        
        // Delay antes de começar a "digitar" (exceto primeira mensagem)
        if (!isFirst) {
          const delay = customDelay || chunkMetadata.delay;
          
          if (showProgress && chunks.length > 2) {
            logger.info(`⏳ Waiting ${Math.round(delay/1000)}s before sending chunk ${i + 1}/${chunks.length}`);
          }
          
          await this.sleep(delay);
        }
        
        // Enviar indicador de "digitando" com duração proporcional
        if (enableTypingIndicator && !isLast) {
          try {
            await sendFunction({
              ...baseData,
              presence: 'composing'
            });
            
            // Simula tempo de digitação (30% do delay calculado)
            const typingDuration = Math.min((chunkMetadata.delay * 0.3), 3000);
            await this.sleep(typingDuration);
            
          } catch (presenceError) {
            logger.warn('Failed to send typing indicator:', presenceError);
          }
        }
        
        // Enviar a mensagem
        await sendFunction({
          ...baseData,
          text: chunk
        });
        
        const contentLabel = chunkMetadata.type !== CONTENT_TYPES.TEXT ? ` (${chunkMetadata.type})` : '';
        logger.info(`📤 Sent chunk ${i + 1}/${chunks.length}${contentLabel}: ${chunk.substring(0, 50)}...`);
        
        // Pequena pausa após enviar para parecer mais natural
        if (!isLast && strategy === CHUNKING_STRATEGIES.NATURAL) {
          await this.sleep(200 + Math.random() * 300); // 200-500ms
        }
      }
      
      // Limpar status "digitando" no final
      if (enableTypingIndicator) {
        try {
          await sendFunction({
            ...baseData,
            presence: 'available'
          });
        } catch (presenceError) {
          logger.warn('Failed to clear typing indicator:', presenceError);
        }
      }
      
    } catch (error) {
      logger.error('Error sending chunked messages:', error);
      throw error;
    }
  },

  /**
   * Utilitário para criar delay
   * @param {number} ms - Milissegundos para aguardar
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Processa resposta do Dify e determina se deve ser quebrada
   * @param {string} message - Resposta do Dify
   * @param {Object} companyConfig - Configurações da empresa
   * @returns {Object} - Análise completa da mensagem
   */
  analyzeMessage(message, companyConfig = {}) {
    const maxLength = companyConfig.message_chunk_size || 280;
    const enableChunking = companyConfig.enable_message_chunking !== false;
    const strategy = companyConfig.chunking_strategy || CHUNKING_STRATEGIES.NATURAL;
    
    if (!enableChunking || !message || message.length <= maxLength) {
      return {
        shouldChunk: false,
        chunks: [message],
        metadata: [{ type: CONTENT_TYPES.TEXT, delay: 0 }],
        strategy: 'single',
        totalEstimatedTime: 0
      };
    }
    
    const result = this.chunkMessage(message, maxLength, {
      strategy,
      preserveFormatting: companyConfig.preserve_formatting !== false
    });
    
    const totalEstimatedTime = result.metadata.reduce((sum, meta) => sum + meta.delay, 0);
    
    return {
      shouldChunk: result.chunks.length > 1,
      chunks: result.chunks,
      metadata: result.metadata,
      strategy: result.chunks.length > 1 ? 'chunked' : 'single',
      totalEstimatedTime,
      chunkCount: result.chunks.length,
      avgChunkSize: Math.round(message.length / result.chunks.length)
    };
  },

  /**
   * Retorna as estratégias disponíveis
   */
  getAvailableStrategies() {
    return Object.values(CHUNKING_STRATEGIES);
  },

  /**
   * Retorna configuração recomendada baseada no tipo de empresa
   */
  getRecommendedConfig(businessType = 'general') {
    const configs = {
      'customer_service': {
        chunking_strategy: CHUNKING_STRATEGIES.NATURAL,
        message_chunk_size: 250,
        enable_message_chunking: true,
        typing_indicator: true,
        preserve_formatting: true
      },
      'marketing': {
        chunking_strategy: CHUNKING_STRATEGIES.EFFICIENT,
        message_chunk_size: 300,
        enable_message_chunking: true,
        typing_indicator: false,
        preserve_formatting: true
      },
      'technical_support': {
        chunking_strategy: CHUNKING_STRATEGIES.FORMAL,
        message_chunk_size: 400,
        enable_message_chunking: true,
        typing_indicator: true,
        preserve_formatting: true
      },
      'general': {
        chunking_strategy: CHUNKING_STRATEGIES.NATURAL,
        message_chunk_size: 280,
        enable_message_chunking: true,
        typing_indicator: true,
        preserve_formatting: true
      }
    };
    
    return configs[businessType] || configs.general;
  }
};

module.exports = { 
  messageChunkerService,
  CHUNKING_STRATEGIES,
  CONTENT_TYPES
};