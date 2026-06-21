import type { Request, Response, NextFunction } from 'express';
import { ROLES } from '@brainwave/shared';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../config/database.js';

/**
 * Resolves the effective permissions for the current user by merging
 * role_permissions with user_permission overrides.
 * Caches the result on `req.user.resolvedPermissions` for the request lifecycle.
 */
async function resolvePermissions(req: Request): Promise<Set<string>> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Return cached permissions if already resolved in this request
  if (req.user.resolvedPermissions) {
    return req.user.resolvedPermissions;
  }

  // 1. Load role permissions
  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: req.user.role.id },
    select: { permission: { select: { name: true } } },
  });

  const permSet = new Set<string>(rolePerms.map((rp) => rp.permission.name));

  // 2. Load user-level overrides
  const userPerms = await prisma.userPermission.findMany({
    where: { userId: req.user.id },
    select: {
      granted: true,
      permission: { select: { name: true } },
    },
  });

  // 3. Merge: granted=true → add, granted=false → remove
  for (const up of userPerms) {
    if (up.granted) {
      permSet.add(up.permission.name);
    } else {
      permSet.delete(up.permission.name);
    }
  }

  // Cache on the request object
  req.user.resolvedPermissions = permSet;
  return permSet;
}

/**
 * Permission authorization middleware.
 * Checks that the user has ALL of the specified permissions.
 * MASTER role always passes.
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // MASTER always passes
    if (req.user.role.name === ROLES.MASTER) {
      next();
      return;
    }

    const resolved = await resolvePermissions(req);

    const missing = permissions.filter((p) => !resolved.has(p));
    if (missing.length > 0) {
      throw new ForbiddenError(
        `Missing required permission(s): ${missing.join(', ')}`,
      );
    }

    next();
  };
}
