import { Router } from 'express';
import * as leaderboards from '../controllers/leaderboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/individual', leaderboards.individual);
router.get('/teams', leaderboards.teams);
router.get('/me', authenticate, leaderboards.myRank);

export default router;
