import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as clubs from '../controllers/clubController.js';
import * as reports from '../controllers/reportController.js';
import * as notifications from '../controllers/notificationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import {
  adminUserUpdateSchema,
  announcementSchema,
  idParamSchema,
  pointAdjustSchema,
  reportResolveSchema,
} from '../validators/schemas.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/stats', admin.platformStats);
router.get('/users', admin.listUsers);
router.patch('/users/:id', validate(idParamSchema, 'params'), validate(adminUserUpdateSchema), admin.updateUser);

router.get('/clubs', clubs.adminListClubs);
router.patch('/clubs/:id', validate(idParamSchema, 'params'), clubs.adminReviewClub);

router.get('/events', admin.listAllEvents);
router.patch('/events/:id', validate(idParamSchema, 'params'), admin.moderateEvent);

router.get('/challenges', admin.listAllChallenges);
router.patch('/challenges/:id', validate(idParamSchema, 'params'), admin.moderateChallenge);

router.get('/submissions', admin.listAllSubmissions);

router.get('/achievements', admin.listAchievements);
router.post('/achievements', admin.upsertAchievement);

router.get('/points', admin.listPointTransactions);
router.post('/points/adjust', validate(pointAdjustSchema), admin.adjustPoints);

router.get('/reports', reports.listReports);
router.patch('/reports/:id', validate(idParamSchema, 'params'), validate(reportResolveSchema), reports.resolveReport);

router.post('/broadcast', validate(announcementSchema), notifications.adminBroadcast);

export default router;
