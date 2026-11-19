import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), auth.register);
router.post('/login', validate(loginSchema), auth.login);
router.get('/me', authenticate, auth.me);
router.post('/logout', authenticate, auth.logout);

export default router;
