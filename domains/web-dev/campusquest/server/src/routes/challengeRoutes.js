import { Router } from 'express';
import * as challenges from '../controllers/challengeController.js';
import { authenticate, optionalAuth, requireOrganizer } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { challengeCreateSchema, challengeUpdateSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, challenges.listChallenges);
router.get('/mine/participations', authenticate, challenges.myParticipations);
router.post('/', authenticate, requireOrganizer, validate(challengeCreateSchema), challenges.createChallenge);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), challenges.getChallenge);
router.patch('/:id', authenticate, requireOrganizer, validate(idParamSchema, 'params'), validate(challengeUpdateSchema), challenges.updateChallenge);
router.post('/:id/close', authenticate, requireOrganizer, validate(idParamSchema, 'params'), challenges.closeChallenge);
router.post('/:id/join', authenticate, validate(idParamSchema, 'params'), challenges.join);
router.get('/:id/participants', authenticate, requireOrganizer, validate(idParamSchema, 'params'), challenges.listParticipants);

export default router;
