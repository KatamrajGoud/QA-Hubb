import { Request, Response, NextFunction } from 'express';

// Extend session type to include our custom fields
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
    userName?: string;
    userEmail?: string;
  }
}

/**
 * Middleware: require authenticated session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware: require one of the given roles.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Middleware: require ADMIN or HEAD role.
 */
export function requireAdminOrHead(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.session.userRole || !['ADMIN', 'HEAD'].includes(req.session.userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}
