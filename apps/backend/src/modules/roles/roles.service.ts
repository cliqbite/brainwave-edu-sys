import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';

export async function list() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      isSystem: true,
      createdAt: true,
      _count: { select: { rolePermissions: true, users: true } },
    },
    orderBy: { id: 'asc' },
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    isSystem: r.isSystem,
    permissionCount: r._count.rolePermissions,
    userCount: r._count.users,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getById(id: number) {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      isSystem: true,
      createdAt: true,
      rolePermissions: {
        select: {
          permission: {
            select: { id: true, name: true, displayName: true, module: true },
          },
        },
      },
    },
  });

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp) => rp.permission),
    createdAt: role.createdAt.toISOString(),
  };
}
