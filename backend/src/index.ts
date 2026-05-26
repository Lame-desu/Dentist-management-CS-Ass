import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';

import env from './config/env.js';
import { testConnection } from './config/database.js';
import { runMigrations } from './database/migrate.js';
import { runSeed } from './database/seeds/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { sendDailyReminders } from './services/reminderService.js';

const app = express();

// ─── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const PORT = env.PORT;

app.listen(PORT, '0.0.0.0', async () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🦷 DAMS Backend API Server                ║');
  console.log(`║   🚀 Running on http://0.0.0.0:${PORT}         ║`);
  console.log(`║   📦 Environment: ${env.NODE_ENV.padEnd(22)}║`);
  console.log('╚══════════════════════════════════════════════╝');

  // Test database connection on startup
  const connected = await testConnection();

  // Run database migrations if connected
  if (connected) {
    try {
      await runMigrations();

      // Seed database if SEED_DB=true (development only)
      if (process.env.SEED_DB === 'true') {
        try {
          await runSeed();
        } catch (seedError) {
          console.error('⚠️  Seed failed — continuing without seed data.');
        }
      }
    } catch (error) {
      console.error('❌ Migration failed — server will continue but database may be incomplete.');
    }
  }
});

export default app;

// ── Daily Appointment Reminder Cron (runs at 8:00 AM every day) ──
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Running daily appointment reminder job...');
  sendDailyReminders();
});
console.log('⏰ Appointment reminder cron job scheduled (daily at 8:00 AM)');
