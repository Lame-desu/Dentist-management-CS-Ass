import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dentistRoutes from './dentistRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';

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

// ─── Placeholder Sub-routes ──────────────────────────────────
// These will be populated in subsequent steps:
// router.use('/dental-records', dentalRecordRoutes);
// router.use('/prescriptions', prescriptionRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/queue', queueRoutes);
// router.use('/clinic', clinicRoutes);

export default router;
