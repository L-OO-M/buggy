import { Router } from 'express';
import * as events from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { idParamSchema } from '../validators/schemas.js';

const router = Router();

router.get('/me', authenticate, events.listMyRegistrations);
router.post('/:id', authenticate, validate(idParamSchema, 'params'), events.registerForEvent);
router.delete('/:id', authenticate, validate(idParamSchema, 'params'), events.cancelRegistration);

export default router;
