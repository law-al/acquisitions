import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from '#config/logger.js';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middlewares/security.middleware.js';

const app = express();

// Middleware - Order matters!
// 1. CORS should be first to handle preflight requests
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // Allow all origins in development
    credentials: true,
  })
);

// 2. Security headers
app.use(helmet());

// 3. Body parsers (before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Logging middleware (should be after body parsers to log request bodies)
app.use(
  morgan('combined', {
    stream: {
      write: message => {
        logger.info(message.trim());
      },
    },
  })
);

// 6. Security middleware
app.use(securityMiddleware);

// Routes
app.get('/api/health', (req, res) => {
  logger.info('Health check endpoint hit');
  res.status(200).json({
    message: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// API routes
app.use('/api/auth', authRoutes);

// Root route (should be last to avoid conflicts)
app.get('/', (req, res) => {
  logger.info('Hello from the server');
  res.status(200).json({ message: 'Hello from the server' });
});

// 404 handler for unregistered routes
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

export default app;
