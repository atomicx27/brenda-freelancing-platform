import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';
import portfolioRoutes from './routes/portfolio';
import companyRoutes from './routes/company';
import jobRoutes from './routes/jobs';
import proposalRoutes from './routes/proposals';
import messageRoutes from './routes/messages';
import reviewRoutes from './routes/reviews';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const getAllowedOrigins = () => {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
  
  if (process.env.FRONTEND_URL) {
    // Split comma-separated origins from environment variable
    const envOrigins = process.env.FRONTEND_URL.split(',').map(origin => origin.trim());
    return [...new Set([...defaultOrigins, ...envOrigins])]; // Remove duplicates
  }
  
  return defaultOrigins;
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - more lenient for development
const isDevelopment = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: isDevelopment ? 10000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Very high limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => {
    return isDevelopment && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});

app.use(limiter);

// More lenient rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 50, // Very high limit for development
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => {
    return isDevelopment && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});

// Apply auth rate limiting to auth routes
app.use('/api/auth', authLimiter);

// More lenient rate limiting for message routes
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 2000 : 200, // Very high limit for development
  message: {
    error: 'Too many message requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => {
    return isDevelopment && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});

// Apply message rate limiting to message routes
app.use('/api/messages', messageLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Brenda API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
