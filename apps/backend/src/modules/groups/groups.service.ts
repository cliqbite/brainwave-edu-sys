import prisma from '../../config/database.js';
import { generateSlug } from '../../utils/slug.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { auditLog } from '../../middlewares/auditLogger.js';
import { buildPrismaQueryArgs, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationQuery, CreateGroupRequest as CreateGroupInput, UpdateGroupRequest as UpdateGroupInput } from '@brainwave/shared';

export async function listGroups(query: PaginationQuery) {
  const { skip, take, orderBy } = buildPrismaQueryArgs(query);
  const where: any = { deletedAt: null };

  if (query.search) {
    where.name = { contains: query.search };
  }

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { userGroups: true } },
      },
    }),
    prisma.group.count({ where }),
  ]);

  const formattedGroups = groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    description: g.description,
    type: g.type,
    status: g.status,
    userCount: g._count.userGroups,
    createdAt: g.createdAt,
  }));

  return {
    groups: formattedGroups,
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}

export async function getGroupById(id: number) {
  const group = await prisma.group.findFirst({
    where: { id, deletedAt: null },
    include: {
      userGroups: {
        include: { user: { select: { id: true, name: true, email: true, role: { select: { displayName: true } } } } },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!group) throw new NotFoundError('Group not found');

  return {
    ...group,
    users: group.userGroups.map((ug: any) => ug.user),
    userGroups: undefined,
  };
}

export async function createGroup(data: CreateGroupInput, createdById: number) {
  const slug = generateSlug(data.name, { unique: true });
  
  const group = await prisma.group.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      type: data.type,
      createdById,
    },
  });

  auditLog({
    userId: createdById,
    action: 'CREATE',
    module: 'GROUPS',
    targetType: 'Group',
    targetId: group.id,
    newValues: { ...group },
  });

  return group;
}

export async function updateGroup(id: number, data: UpdateGroupInput, updatedById: number) {
  const existingGroup = await prisma.group.findFirst({ where: { id, deletedAt: null } });
  if (!existingGroup) throw new NotFoundError('Group not found');

  const group = await prisma.group.update({
    where: { id },
    data,
  });

  auditLog({
    userId: updatedById,
    action: 'UPDATE',
    module: 'GROUPS',
    targetType: 'Group',
    targetId: group.id,
    oldValues: existingGroup,
    newValues: group,
  });

  return group;
}

export async function deleteGroup(id: number, deletedById: number) {
  const existingGroup = await prisma.group.findFirst({ where: { id, deletedAt: null } });
  if (!existingGroup) throw new NotFoundError('Group not found');

  await prisma.group.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });

  auditLog({
    userId: deletedById,
    action: 'DELETE',
    module: 'GROUPS',
    targetType: 'Group',
    targetId: id,
    oldValues: existingGroup,
  });

  return true;
}

export async function addUsersToGroup(groupId: number, userIds: number[], addedById: number) {
  const group = await prisma.group.findFirst({ where: { id: groupId, deletedAt: null } });
  if (!group) throw new NotFoundError('Group not found');

  const existingLinks = await prisma.userGroup.findMany({
    where: { groupId, userId: { in: userIds } },
    select: { userId: true },
  });
  
  const existingUserIds = new Set(existingLinks.map((l: any) => l.userId));
  const newUserIds = userIds.filter(id => !existingUserIds.has(id));

  if (newUserIds.length > 0) {
    await prisma.userGroup.createMany({
      data: newUserIds.map(userId => ({
        userId,
        groupId,
        addedById,
      })),
    });

    auditLog({
      userId: addedById,
      action: 'UPDATE',
      module: 'GROUPS',
      targetType: 'Group',
      targetId: groupId,
      newValues: { addedUserIds: newUserIds },
    });
  }

  return { addedCount: newUserIds.length };
}

export async function removeUserFromGroup(groupId: number, userId: number, removedById: number) {
  const link = await prisma.userGroup.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!link) throw new NotFoundError('User not in group');

  await prisma.userGroup.delete({
    where: { id: link.id },
  });

  auditLog({
    userId: removedById,
    action: 'UPDATE',
    module: 'GROUPS',
    targetType: 'Group',
    targetId: groupId,
    newValues: { removedUserId: userId },
  });

  return true;
}
