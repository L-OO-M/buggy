import { Router } from 'express';
import * as clubs from '../controllers/clubController.js';
import { authenticate, optionalAuth, requireOrganizer } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import {
  clubCreateSchema,
  clubUpdateSchema,
  idParamSchema,
  membershipDecisionSchema,
  slugParamSchema,
} from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, clubs.listClubs);
router.get('/mine', authenticate, clubs.listMyClubs);
router.post('/', authenticate, requireOrganizer, validate(clubCreateSchema), clubs.createClub);
router.get('/:slug', optionalAuth, validate(slugParamSchema, 'params'), clubs.getClub);
router.patch('/:id', authenticate, requireOrganizer, validate(idParamSchema, 'params'), validate(clubUpdateSchema), clubs.updateClub);
router.post('/:id/join', authenticate, validate(idParamSchema, 'params'), clubs.requestMembership);
router.delete('/:id/leave', authenticate, validate(idParamSchema, 'params'), clubs.leaveClub);
router.get('/:id/requests', authenticate, requireOrganizer, validate(idParamSchema, 'params'), clubs.listMembershipRequests);
router.patch(
  '/:id/requests/:userId',
  authenticate,
  requireOrganizer,
  validate(idParamSchema, 'params'),
  validate(membershipDecisionSchema),
  clubs.decideMembership,
);
router.get('/:id/members', authenticate, validate(idParamSchema, 'params'), clubs.listClubMembers);
router.get('/:id/activity', optionalAuth, validate(idParamSchema, 'params'), clubs.getClubActivity);
router.post('/:id/archive', authenticate, requireOrganizer, validate(idParamSchema, 'params'), clubs.archiveClub);

export default router;
