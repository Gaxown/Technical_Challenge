import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { config } from './config';
import { initializeDatabase, closeDatabase } from './models/database';
import { requestLogger } from './middleware/requestLogger';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { RequestWithId } from './middleware/requestLogger';

import patientRoutes from './routes/patient.routes';
import voiceNoteRoutes from './routes/voiceNote.routes';
import summaryRoutes from './routes/summary.routes';
import healthRoutes from './routes/health.routes';

const app = express();

// Security & Performance
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.nodeEnv === 'production' ? false : '*',
    credentials: true,
  })
);

// Attach request ID
app.use(requestLogger);

morgan.token('request-id', (req: RequestWithId) => req.id || 'no-id');

// Morgan &Winston
app.use(
  morgan(':request-id :method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

// Global cfg
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// no auth req
app.use('/health', healthRoutes);

// auth & rate limit req
app.use('/api', rateLimiter);
app.use('/api', apiKeyAuth);

// API Routing sys
app.use('/api/patients', patientRoutes);
app.use('/api/voice-notes', voiceNoteRoutes);
app.use('/api/summaries', summaryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Error handler generic
app.use((err: Error, _req: Request, res: Response) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

// init db
(async () => {
  await initializeDatabase();

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, {
      environment: config.nodeEnv,
      port: config.port,
    });
  });

  // shutdown
  const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, closing server...');
    server.close(() => {
      logger.info('Server closed');
      closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
})();

export default app;
