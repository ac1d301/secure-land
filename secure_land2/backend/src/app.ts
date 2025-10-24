import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import verifyRoutes from './routes/verifyRoutes';
import notificationRoutes from './routes/notificationRoutes';
import proxyRoutes from './routes/proxyRoutes';
import adminRoutes from './routes/adminRoutes';
import integrityRoutes from './routes/integrityRoutes';

// Import middleware
import { ResponseHandler } from './utils/responseHandler';
import { logger } from './utils/logger';
import { initializeProxyServices, getCurrentProxyMode } from './services/proxySelector';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

app.use(async (req, res, next) => {
  if (!req.app.locals.proxyInitialized) {
    try {
      await initializeProxyServices();
      req.app.locals.proxyInitialized = true;
      logger.info(`Proxy services initialized in ${getCurrentProxyMode().toUpperCase()} mode`);
    } catch (error) {
      logger.error('Failed to initialize proxy services:', error);
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  ResponseHandler.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, 'Service is healthy');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/notify', notificationRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrity', integrityRoutes);

// 404 handler
app.use('*', (req, res) => {
  ResponseHandler.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler:', error);
  
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    ResponseHandler.error(res, 'File too large. Maximum size is 10MB.', 413);
    return;
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    ResponseHandler.error(res, 'Unexpected field name for file upload.', 400);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    ResponseHandler.validationError(res, 'Validation failed', error.message);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseHandler.unauthorized(res, 'Invalid token');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseHandler.unauthorized(res, 'Token expired');
    return;
  }

  // Default error
  ResponseHandler.error(res, 'Internal server error', 500);
});

export default app;
