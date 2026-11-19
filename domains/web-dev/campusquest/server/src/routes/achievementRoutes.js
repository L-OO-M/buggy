import { Router } from 'express';
import * as achievements from '../controllers/achievementController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, achievements.listAchievements);
router.get('/me', authenticate, achievements.myAchievements);
router.post('/recheck', authenticate, achievements.recheckAchievements);

export default router;
