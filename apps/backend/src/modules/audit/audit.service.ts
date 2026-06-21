import prisma from '../../config/database.js';
import { buildPrismaQueryArgs, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationQuery } from '@brainwave/shared';

export async function getLogs(query: PaginationQuery & { module?: string; action?: string; userId?: string }) {
  const { skip, take, orderBy } = buildPrismaQueryArgs(query);
  const where: any = {};

  if (query.module) where.module = query.module;
  if (query.action) where.action = query.action;
  if (query.userId) where.userId = Number(query.userId);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: query.sortBy ? orderBy : { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Convert BigInt to string for JSON serialization
  const formattedLogs = logs.map(log => ({
    ...log,
    id: log.id.toString(),
  }));

  return {
    logs: formattedLogs,
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}
