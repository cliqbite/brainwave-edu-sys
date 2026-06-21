import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { NotFoundError } from '../../utils/errors.js';

export async function list() {
  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      module: true,
      description: true,
    },
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  });

  // Group permissions by module
  const grouped: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push(perm);
  }

  return grouped;
}

export async function getUserPermissions(userId: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
          rolePermissions: {
            select: {
              permission: {
                select: { id: true, name: true, displayName: true, module: true },
              },
            },
          },
        },
      },
      userPermissions: {
        select: {
          id: true,
          permission: {
            select: { id: true, name: true, displayName: true, module: true },
          },
          granted: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Build resolved permissions
  const rolePermissions = user.role?.rolePermissions.map((rp) => ({
    ...rp.permission,
    source: 'role' as const,
    granted: true,
  })) || [];

  const userOverrides = user.userPermissions.map((up) => ({
    ...up.permission,
    source: 'user' as const,
    granted: up.granted,
  }));

  // Merge: start with role perms, apply user overrides
  const permMap = new Map<number, { id: number; name: string; displayName: string; module: string; source: 'role' | 'user'; granted: boolean }>();

  for (const rp of rolePermissions) {
    permMap.set(rp.id, rp);
  }

  for (const up of userOverrides) {
    permMap.set(up.id, up);
  }

  return {
    user: { id: user.id, name: user.name, email: user.email },
    role: { id: user.role.id, name: user.role.name, displayName: user.role.displayName },
    permissions: Array.from(permMap.values()),
    overrides: userOverrides,
  };
}

export async function setUserPermissions(
  userId: number,
  permissions: Array<{ permissionId: number; granted: boolean }>,
  grantedById: number,
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.$transaction(async (tx) => {
    // Remove all existing user permission overrides for this user
    await tx.userPermission.deleteMany({
      where: { userId },
    });

    // Create new overrides
    if (permissions.length > 0) {
      await tx.userPermission.createMany({
        data: permissions.map((p) => ({
          userId,
          permissionId: p.permissionId,
          granted: p.granted,
          grantedById,
        })),
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: grantedById,
        action: 'PERMISSION_CHANGE',
        module: 'PERMISSIONS',
        targetType: 'User',
        targetId: userId,
        newValues: { permissions },
      },
    });
  });

  logger.info({ userId, grantedById, count: permissions.length }, 'User permissions updated');
  return getUserPermissions(userId);
}
