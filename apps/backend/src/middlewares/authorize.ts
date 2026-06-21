import type { Request, Response, NextFunction } from 'express';
import { ROLES } from '@brainwave/shared';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * Role-based authorization middleware.
 * Checks that `req.user.role.name` is one of the allowed roles.
 * The MASTER role always passes (superuser bypass).
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRole = req.user.role.name;

    // MASTER always passes
    if (userRole === ROLES.MASTER) {
      next();
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError(
        `Role '${userRole}' is not authorized to access this resource`,
      );
    }

    next();
  };
}
