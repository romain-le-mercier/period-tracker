import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PeriodService } from '../services/period.service';
import { PredictionService } from '../services/predictionService';
import prisma from '../db';

const periodService = new PeriodService();
const predictionService = new PredictionService(prisma);

export class PeriodController {
  createPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' },
        });
      }
      
      const period = await periodService.createPeriod(req.user.userId, {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      
      // Generate predictions after creating period
      try {
        await predictionService.updatePredictionsForUser(req.user.userId);
      } catch (error) {
        console.error('Failed to generate predictions:', error);
      }
      
      res.status(201).json({
        message: 'Period created successfully',
        period,
      });
    } catch (error: any) {
      if (error.message === 'Period dates overlap with existing period') {
        return res.status(409).json({
          error: { message: error.message },
        });
      }
      next(error);
    }
  }
  
  updatePeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' },
        });
      }
      
      const { id } = req.params;
      const updateData = {
        ...req.body,
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
        ...(req.body.endDate && { endDate: new Date(req.body.endDate) }),
      };
      
      const period = await periodService.updatePeriod(
        req.user.userId,
        id,
        updateData
      );
      
      // Generate predictions after updating period
      try {
        await predictionService.updatePredictionsForUser(req.user.userId);
      } catch (error) {
        console.error('Failed to generate predictions:', error);
      }
      
      res.json({
        message: 'Period updated successfully',
        period,
      });
    } catch (error: any) {
      if (error.message === 'Period not found') {
        return res.status(404).json({
          error: { message: error.message },
        });
      }
      next(error);
    }
  }
  
  deletePeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' },
        });
      }
      
      const { id } = req.params;
      await periodService.deletePeriod(req.user.userId, id);
      
      // Generate predictions after deleting period
      try {
        await predictionService.updatePredictionsForUser(req.user.userId);
      } catch (error) {
        console.error('Failed to generate predictions:', error);
      }
      
      res.json({
        message: 'Period deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Period not found') {
        return res.status(404).json({
          error: { message: error.message },
        });
      }
      next(error);
    }
  }
  
  getPeriods = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' },
        });
      }
      
      const { page, limit, startDate, endDate } = req.query;
      
      const result = await periodService.getPeriods(req.user.userId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  getCurrentPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' },
        });
      }
      
      const period = await periodService.getCurrentPeriod(req.user.userId);
      
      if (!period) {
        return res.status(404).json({
          error: { message: 'No active period found' },
        });
      }
      
      res.json({ period });
    } catch (error) {
      next(error);
    }
  }
}