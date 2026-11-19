import { Router } from 'express';
import * as events from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { idParamSchema } from '../validators/schemas.js';

const router = Router();

router.post('/checkin', authenticate, events.checkIn);
router.post('/events/:id/manual', authenticate, validate(idParamSchema, 'params'), events.manualCheckIn);

export default router;
