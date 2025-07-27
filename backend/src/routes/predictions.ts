import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PredictionService } from '../services/predictionService';
import prisma from '../db';

const router = Router();
const predictionService = new PredictionService(prisma);

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const predictions = await predictionService.getPredictions(req.user.userId);
    res.json({ predictions });
  } catch (error) {
    console.error('Failed to get predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await predictionService.updatePredictionsForUser(req.user.userId);
    const predictions = await predictionService.getPredictions(req.user.userId);
    res.json({ predictions });
  } catch (error) {
    console.error('Failed to generate predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

export default router;