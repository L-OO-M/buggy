import { Router } from 'express';
import * as submissions from '../controllers/submissionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { idParamSchema, reviewSchema, submissionCreateSchema } from '../validators/schemas.js';

const router = Router();

router.post('/', authenticate, validate(submissionCreateSchema), submissions.createSubmission);
router.get('/mine', authenticate, submissions.listMySubmissions);
router.get('/review-queue', authenticate, requireRole('organizer', 'admin'), submissions.reviewQueue);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), submissions.getSubmission);
router.patch('/:id/review', authenticate, requireRole('organizer', 'admin'), validate(idParamSchema, 'params'), validate(reviewSchema), submissions.reviewSubmission);
router.post('/:id/revoke', authenticate, requireRole('organizer', 'admin'), validate(idParamSchema, 'params'), submissions.revokeSubmission);

export default router;
