import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { initDb } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { policyRouter } from './routes/policy.js';
import { illustrationRouter } from './routes/illustrations.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security headers with helmet
app.use(helmet());

// CORS config allowing requests from CLIENT_ORIGIN, localhost, and Vercel domains with credentials
const configuredOrigin = env.CLIENT_ORIGIN.replace(/\/$/, '');
const allowedOrigins = [configuredOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsing and cookies
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/policy', policyRouter);
app.use('/api/illustrations', illustrationRouter);

// Global error handler
app.use(errorHandler);

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      await initDb();
      app.listen(env.PORT, () => {
        console.log(`Backend server running on http://localhost:${env.PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };

  startServer();
}
