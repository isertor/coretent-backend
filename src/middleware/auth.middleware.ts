// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

// Extended Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    emailAlias: string;
  };
}

/**
 * Simple authentication middleware
 * For now, we just extract userId from headers
 * In production, implement proper JWT authentication
 */
export function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('No authorization header provided');
  }

  // For now, accept Bearer token as userId
  // TODO: Implement proper JWT validation
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('Invalid authorization token');
  }

  // Attach user to request
  (req as AuthRequest).user = {
    userId: token,
    emailAlias: `u-${token}@newsletters.coretent.app`
  };

  next();
}

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      (req as AuthRequest).user = {
        userId: token,
        emailAlias: `u-${token}@newsletters.coretent.app`
      };
    }
  }

  next();
}
