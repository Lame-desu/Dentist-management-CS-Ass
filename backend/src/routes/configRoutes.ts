import { Router } from 'express';
import * as clinicConfigController from '../controllers/clinicConfigController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '../utils/constants.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// GET /api/config — Any authenticated user can read clinic config
router.get('/', clinicConfigController.getAllConfig);

// GET /api/config/working-hours — Get parsed working hours
router.get('/working-hours', clinicConfigController.getWorkingHours);

// PUT /api/config/:key — Admin updates a config value
router.put(
  '/:key',
  authorize(UserRole.ADMIN),
  clinicConfigController.updateConfig
);

export default router;
