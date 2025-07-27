import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      
      res.status(201).json({
        message: 'Registration successful',
        ...result,
      });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: {
            message: error.message,
          },
        });
      }
      next(error);
    }
  }
  
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          error: {
            message: error.message,
          },
        });
      }
      next(error);
    }
  }
  
  refresh = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Authentication required',
          },
        });
      }
      
      const tokens = await authService.refreshToken(req.user.userId);
      
      res.json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error: any) {
      if (error.message === 'User not found or inactive') {
        return res.status(401).json({
          error: {
            message: error.message,
          },
        });
      }
      next(error);
    }
  }
  
  logout = async (_req: AuthRequest, res: Response) => {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      message: 'Logout successful',
    });
  }
  
  getCurrentUser = async (userId: string) => {
    return authService.getUserById(userId);
  }
}