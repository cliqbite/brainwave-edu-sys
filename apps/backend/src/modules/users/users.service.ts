import bcrypt from 'bcrypt';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors.js';
import {
  parsePaginationQuery,
  buildPaginationMeta,
  buildPrismaQueryArgs,
} from '../../utils/pagination.js';
import { ROLES } from '@brainwave/shared';
import type { CreateUserInput, UpdateUserInput } from './users.validator.js';
import type { Prisma } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

export async function list(query: Record<string, unknown>) {
  const pagination = parsePaginationQuery(query, { sortBy: 'createdAt' });
  const { skip, take, orderBy } = buildPrismaQueryArgs(pagination);

  const roleId = query['roleId'] ? Number(query['roleId']) : undefined;
  const status = query['status'] as string | undefined;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(roleId && { roleId }),
    ...(status && { status: status as any }),
    ...(pagination.search && {
      OR: [
        { name: { contains: pagination.search } },
        { email: { contains: pagination.search } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        rollNumber: true,
        department: true,
        className: true,
        status: true,
        createdAt: true,
        role: { select: { name: true, displayName: true } },
        _count: { select: { userGroups: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => ({
    id: u.id,
    uuid: u.uuid,
    name: u.name,
    email: u.email,
    phone: u.phone,
    whatsappNumber: u.whatsappNumber,
    rollNumber: u.rollNumber,
    department: u.department,
    className: u.className,
    role: u.role,
    status: u.status,
    groupCount: u._count.userGroups,
    createdAt: u.createdAt.toISOString(),
  }));

  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return { data, meta };
}

export async function getById(id: number) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      rollNumber: true,
      department: true,
      className: true,
      status: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
      userGroups: {
        select: {
          group: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      },
      userPermissions: {
        select: {
          permission: { select: { id: true, name: true, displayName: true, module: true } },
          granted: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    ...user,
    groups: user.userGroups.map((ug) => ug.group),
    userGroups: undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function create(data: CreateUserInput, createdById: number, creatorRoleName: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  // Only MASTER can assign the MASTER role
  if (data.roleId) {
    const targetRole = await prisma.role.findUnique({ where: { id: data.roleId }, select: { name: true } });
    if (targetRole?.name === ROLES.MASTER && creatorRoleName !== ROLES.MASTER) {
      throw new ForbiddenError('Only MASTER can assign the MASTER role');
    }
  }

  // Default to USER role if not specified
  let roleId = data.roleId;
  if (!roleId) {
    const userRole = await prisma.role.findUnique({
      where: { name: ROLES.USER },
    });
    if (!userRole) {
      throw new Error('Default USER role not found. Please run database seed.');
    }
    roleId = userRole.id;
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone ?? null,
        whatsappNumber: data.whatsappNumber ?? null,
        rollNumber: data.rollNumber ?? null,
        department: data.department ?? null,
        className: data.className ?? null,
        roleId,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: { select: { id: true, name: true, displayName: true } },
        status: true,
        createdAt: true,
      },
    });

    // Assign to groups if provided
    if (data.groupIds && data.groupIds.length > 0) {
      await tx.userGroup.createMany({
        data: data.groupIds.map((groupId) => ({
          userId: newUser.id,
          groupId,
          addedById: createdById,
        })),
        skipDuplicates: true,
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        module: 'USERS',
        targetType: 'User',
        targetId: newUser.id,
        newValues: { name: data.name, email: data.email, roleId },
      },
    });

    return newUser;
  });

  logger.info({ userId: user.id, createdById }, 'User created');
  return user;
}

export async function update(id: number, data: UpdateUserInput, updatedById: number, updaterRoleName: string) {
  const existingUser = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Only MASTER can assign the MASTER role
  if (data.roleId) {
    const targetRole = await prisma.role.findUnique({ where: { id: data.roleId }, select: { name: true } });
    if (targetRole?.name === ROLES.MASTER && updaterRoleName !== ROLES.MASTER) {
      throw new ForbiddenError('Only MASTER can assign the MASTER role');
    }
  }

  // Check email uniqueness if email is being changed
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new ConflictError('A user with this email already exists');
    }
  }

  // Capture old values for audit log
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && (existingUser as any)[key] !== value) {
      oldValues[key] = (existingUser as any)[key];
      newValues[key] = value;
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.rollNumber !== undefined && { rollNumber: data.rollNumber }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.className !== undefined && { className: data.className }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: { select: { id: true, name: true, displayName: true } },
        status: true,
        updatedAt: true,
      },
    });

    if (Object.keys(newValues).length > 0) {
      await tx.auditLog.create({
        data: {
          userId: updatedById,
          action: 'UPDATE',
          module: 'USERS',
          targetType: 'User',
          targetId: id,
          oldValues: existingUser as any,
          newValues: newValues as any,
        },
      });
    }

    return updated;
  });

  logger.info({ userId: id, updatedById }, 'User updated');
  return user;
}

export async function remove(id: number, deletedById: number) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        module: 'USERS',
        targetType: 'User',
        targetId: id,
        oldValues: { name: user.name, email: user.email },
      },
    }),
  ]);

  logger.info({ userId: id, deletedById }, 'User soft-deleted');
}

export async function resetPassword(id: number, newPasswordPlain: string, updatedById: number) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const passwordHash = await bcrypt.hash(newPasswordPlain, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { passwordHash },
    }),
    prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        module: 'USERS',
        targetType: 'User',
        targetId: id,
        oldValues: { password: '***' },
        newValues: { password: '***' },
      },
    }),
  ]);

  logger.info({ userId: id, updatedById }, 'User password reset');
}
