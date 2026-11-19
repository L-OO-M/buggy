import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isTest) app.use(morgan('dev'));

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', service: 'campusquest-api', time: new Date().toISOString() } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/leaderboards', leaderboardRoutes);
  app.use('/api/achievements', achievementRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
