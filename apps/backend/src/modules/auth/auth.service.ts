import bcrypt from 'bcrypt';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../../utils/jwt.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors.js';
import { ROLES } from '@brainwave/shared';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validator.js';

const BCRYPT_ROUNDS = 12;

export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  const userRole = await prisma.role.findUnique({
    where: { name: ROLES.USER },
  });

  if (!userRole) {
    throw new Error('Default USER role not found. Please run database seed.');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone ?? null,
      roleId: userRole.id,
    },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      phone: true,
      role: { select: { id: true, name: true, displayName: true } },
      status: true,
      createdAt: true,
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered');
  return user;
}

export async function login(
  email: string,
  password: string,
  meta: { ipAddress?: string; userAgent?: string },
) {
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    include: {
      role: { select: { id: true, name: true, displayName: true } },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account is inactive or suspended');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokenPayload: TokenPayload = {
    userId: user.id,
    uuid: user.uuid,
    roleId: user.role.id,
    roleName: user.role.name,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Calculate refresh token expiry from the env config string (e.g. "7d")
  const expiresAt = computeExpiry(env.JWT_REFRESH_EXPIRY);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    },
  });

  logger.info({ userId: user.id }, 'User logged in');

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
      rollNumber: user.rollNumber,
      department: user.department,
      className: user.className,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

export async function refreshToken(
  token: string,
  meta: { ipAddress?: string; userAgent?: string },
) {
  // Verify JWT signature and expiry
  const decoded = verifyRefreshToken(token);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { include: { role: true } } },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Refresh token not found');
  }

  // Theft detection: if the token was already revoked, someone is reusing a stolen token.
  // Revoke ALL tokens for this user to force re-authentication everywhere.
  if (storedToken.revoked) {
    logger.warn(
      { userId: storedToken.userId, token: token.slice(0, 20) },
      'Refresh token reuse detected — revoking all tokens for user',
    );
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revoked: true },
    });
    throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
  }

  // Check expiry
  if (storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token has expired');
  }

  // Check that the user is still active
  if (!storedToken.user || storedToken.user.deletedAt || storedToken.user.status !== 'ACTIVE') {
    throw new UnauthorizedError('User account is no longer active');
  }

  const tokenPayload: TokenPayload = {
    userId: storedToken.user.id,
    uuid: storedToken.user.uuid,
    roleId: storedToken.user.role.id,
    roleName: storedToken.user.role.name,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  const expiresAt = computeExpiry(env.JWT_REFRESH_EXPIRY);

  // Rotate: revoke old, create new, link them
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, replacedBy: newRefreshToken },
    }),
    prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: newRefreshToken,
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshTokenValue: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
  });

  if (storedToken && !storedToken.revoked) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });
    logger.info({ userId: storedToken.userId }, 'User logged out');
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
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
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
          rolePermissions: {
            select: { permission: { select: { name: true } } },
          },
        },
      },
      userPermissions: {
        select: {
          permission: { select: { name: true } },
          granted: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Resolve permissions: start with role permissions, then apply user overrides
  const rolePermissions = new Set(
    user.role.rolePermissions.map((rp) => rp.permission.name),
  );

  // Apply user-level overrides
  for (const up of user.userPermissions) {
    if (up.granted) {
      rolePermissions.add(up.permission.name);
    } else {
      rolePermissions.delete(up.permission.name);
    }
  }

  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    whatsappNumber: user.whatsappNumber,
    rollNumber: user.rollNumber,
    department: user.department,
    className: user.className,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName,
    },
    permissions: Array.from(rolePermissions),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Parses a duration string like "7d", "15m", "24h" into a future Date */
function computeExpiry(expiryStr: string): Date {
  const match = expiryStr.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7d
  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + amount * multipliers[unit]);
}

export async function changePassword(userId: number, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const isPasswordValid = await bcrypt.compare(data.oldPassword, user.passwordHash);
  if (!isPasswordValid) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  logger.info({ userId }, 'User changed password');
}
