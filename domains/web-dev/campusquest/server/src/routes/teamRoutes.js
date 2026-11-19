import { Router } from 'express';
import * as teams from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { idParamSchema, invitationResponseSchema, teamCreateSchema, teamInviteSchema } from '../validators/schemas.js';
import { z } from 'zod';

const router = Router();

router.get('/mine', authenticate, teams.listMyTeams);
router.post('/', authenticate, validate(teamCreateSchema), teams.createTeam);
router.get('/invitations', authenticate, teams.listMyInvitations);
router.patch(
  '/invitations/:id/respond',
  authenticate,
  validate(invitationResponseSchema),
  teams.respondToInvitation,
);
router.delete('/invitations/:id', authenticate, teams.cancelInvitation);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), teams.getTeam);
router.get('/:id/progress', authenticate, validate(idParamSchema, 'params'), teams.teamProgress);
router.post('/:id/invite', authenticate, validate(idParamSchema, 'params'), validate(teamInviteSchema), teams.inviteToTeam);
router.delete('/:id/members/:userId', authenticate, validate(idParamSchema, 'params'), teams.removeMember);
router.post('/:id/leave', authenticate, validate(idParamSchema, 'params'), teams.leaveTeam);
router.post(
  '/:id/transfer',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) })),
  teams.transferLeadership,
);
router.post('/:id/archive', authenticate, validate(idParamSchema, 'params'), teams.archiveTeam);

export default router;
