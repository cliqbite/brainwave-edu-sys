import type { Request, Response, NextFunction } from 'express';
import type { PermissionName } from '@brainwave/shared';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../config/database.js';

/** Shape of the authenticated user attached to `req.user` */
export interface AuthenticatedUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
    displayName: string;
  };
  status: string;
  /** Resolved effective permissions – populated lazily by requirePermission */
  resolvedPermissions?: Set<string>;
}

/** Augment Express Request with the authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts the Bearer token, verifies it, loads the user + role,
 * and attaches the user to `req.user`.
 */
export function authenticate() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    req.user = user;
    next();
  };
}
