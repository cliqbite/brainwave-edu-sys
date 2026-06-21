import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sendSuccess, sendError } from './utils/response.js';

// ---- Route imports ----
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import permissionsRoutes from './modules/permissions/permissions.routes.js';
import groupsRoutes from './modules/groups/groups.routes.js';
import importsRoutes from './modules/imports/imports.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import pushRoutes from './modules/push/push.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// ---- Global middleware ----
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(apiLimiter);

// ---- Health check ----
app.get('/api/v1/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 'Service is healthy');
});

// ---- Public config ----
app.get('/api/v1/public/config', (_req, res) => {
  sendSuccess(res, {
    appName: env.APP_NAME,
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
  }, 'Public configuration');
});

// ---- API routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/permissions', permissionsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/import', importsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/push', pushRoutes);
app.use('/api/v1/audit', auditRoutes);

// ---- 404 handler ----
app.use((_req, res) => {
  sendError(res, 'Route not found', 404);
});

// ---- Error handler (must be last) ----
app.use(errorHandler);

export default app;
