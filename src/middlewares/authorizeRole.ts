import { Request, Response, NextFunction } from 'express';
import { UserAttributes } from '../models/user.js';

export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = req.user as UserAttributes;

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${user.role}`,
          requiredRoles: allowedRoles,
          userRole: user.role
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};