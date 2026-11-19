import { Router } from 'express';
import * as users from '../controllers/usersController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { profileUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/me/stats', authenticate, users.getMyStats);
router.get('/me/points', authenticate, users.getMyPoints);
router.get('/me/submissions', authenticate, users.getMySubmissions);
router.patch('/me', authenticate, validate(profileUpdateSchema), users.updateProfile);
router.get('/:id', users.getPublicProfile);

export default router;
