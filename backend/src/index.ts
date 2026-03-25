import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { authRouter } from './routes/auth';
import { contractsRouter } from './routes/contracts';
import { suppliersRouter } from './routes/suppliers';
import { agenciesRouter } from './routes/agencies';
import { budgetRouter } from './routes/budget';
import { usersRouter } from './routes/users';
import { documentsRouter } from './routes/documents';
import { settingsRouter } from './routes/settings';
import { distributionTemplatesRouter } from './routes/distributionTemplates';
import { startCronJobs } from './services/cronService';

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' },
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/distribution-templates', distributionTemplatesRouter);

app.use('/uploads', express.static(
  process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur le port ${PORT}`);
  console.log(`📊 Environnement : ${process.env.NODE_ENV}`);
  startCronJobs();
});

export default app;
