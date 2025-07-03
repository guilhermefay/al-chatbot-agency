require('dotenv').config();
// Force Railway redeploy - CORS fix commit
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { logger } = require('./config/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { defaultLimiter, webhookLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes');

const app = express();

// Trust proxy for Railway deployment (fixes rate limiting)
app.set('trust proxy', true);

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://frontend-orpin-three-62.vercel.app',
        'https://al-studio.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting (can be disabled for debugging)
if (!process.env.DISABLE_RATE_LIMITING) {
  app.use('/api/webhook', webhookLimiter);
  app.use('/api', defaultLimiter);
  logger.info('📊 Rate limiting enabled');
} else {
  logger.info('⚠️  Rate limiting disabled for debugging');
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) },
  skip: (req) => req.url === '/health' // Skip health check logs
}));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use(errorHandler);

module.exports = app; 

// Railway sync fix - v3 