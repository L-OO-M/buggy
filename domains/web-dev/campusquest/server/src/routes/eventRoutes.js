import { Router } from 'express';
import * as events from '../controllers/eventController.js';
import { authenticate, optionalAuth, requireOrganizer } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { eventCreateSchema, eventUpdateSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, events.listEvents);
router.get('/mine/registrations', authenticate, events.listMyRegistrations);
router.post('/', authenticate, requireOrganizer, validate(eventCreateSchema), events.createEvent);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), events.getEvent);
router.patch('/:id', authenticate, requireOrganizer, validate(idParamSchema, 'params'), validate(eventUpdateSchema), events.updateEvent);
router.post('/:id/cancel', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.cancelEvent);
router.get('/:id/participants', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.listParticipants);
router.get('/:id/checkin-code', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.generateCheckInCode);
router.post('/:id/checkin-code/rotate', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.rotateCheckInCode);
router.patch('/:id/checkin-settings', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.toggleCheckIn);
router.post('/:id/checkin/manual', authenticate, requireOrganizer, validate(idParamSchema, 'params'), events.manualCheckIn);

export default router;
