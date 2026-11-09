import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sessionMiddleware } from './lib/session';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import resourceRoutes from './routes/resources';
import buildRoutes from './routes/builds';
import bugRoutes from './routes/bugs';
import dailyUpdateRoutes from './routes/dailyUpdates';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import activityRoutes from './routes/activity';
import reportRoutes from './routes/reports';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // required for cookies / session
  })
);

// ─── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ─── Session ────────────────────────────────────────────────────────────────
app.use(sessionMiddleware);

// ─── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
// Nested resource routes — mergeParams is enabled in the sub-routers
app.use('/api/projects/:projectId/resources', resourceRoutes);
app.use('/api/projects/:projectId/builds', buildRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/reports', reportRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅  Server running on http://127.0.0.1:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
});

export default app;
