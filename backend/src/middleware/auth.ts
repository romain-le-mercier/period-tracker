import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
        },
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};