import { Router, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/schemas';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authenticate, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await authController.getCurrentUser(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

export default router;