import { Router } from 'express';
import * as reports from '../controllers/reportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { reportCreateSchema, reportResolveSchema } from '../validators/schemas.js';

const router = Router();

router.post('/', authenticate, validate(reportCreateSchema), reports.createReport);
router.get('/mine', authenticate, reports.myReports);
router.get('/', authenticate, requireRole('admin'), reports.listReports);
router.patch('/:id', authenticate, requireRole('admin'), validate(reportResolveSchema), reports.resolveReport);

export default router;
