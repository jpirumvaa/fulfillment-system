import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/sendResponse';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendResponse(
        res,
        401,
        'No token provided. Please authenticate.',
        null,
        true
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
      };

      req.user = decoded;
      next();
    } catch (error) {
      return sendResponse(
        res,
        401,
        'Invalid or expired token. Please authenticate.',
        null,
        true
      );
    }
  } catch (error) {
    return sendResponse(res, 500, 'Authentication error', error, true);
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't reject if missing
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || 'your-secret-key';

      try {
        const decoded = jwt.verify(token, secret) as {
          id: string;
          email: string;
        };
        req.user = decoded;
      } catch (error) {
        // Token invalid, but we continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};