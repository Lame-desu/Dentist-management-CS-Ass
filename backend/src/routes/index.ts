import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dentistRoutes from './dentistRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import availabilityRoutes from './availabilityRoutes.js';
import configRoutes from './configRoutes.js';
import dentalRecordRoutes from './dentalRecordRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';

const router = Router();

// ─── Health Check ────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dams-backend',
    version: '1.0.0',
  });
});

// ─── Route Modules ───────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dentists', dentistRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/availability', availabilityRoutes);
router.use('/config', configRoutes);
router.use('/dental-records', dentalRecordRoutes);
router.use('/prescriptions', prescriptionRoutes);

// ─── Placeholder Sub-routes ──────────────────────────────────
// These will be populated in subsequent steps:
// router.use('/notifications', notificationRoutes);
// router.use('/queue', queueRoutes);

export default router;
