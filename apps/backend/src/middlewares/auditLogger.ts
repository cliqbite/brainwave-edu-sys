import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export interface AuditLogParams {
  userId?: number | null;
  action: string;
  module: string;
  targetType?: string;
  targetId?: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit_log entry.
 * Non-blocking: fire-and-forget so it never delays the response.
 */
export function auditLog(params: AuditLogParams): void {
  prisma.auditLog
    .create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        oldValues: params.oldValues as any ?? undefined,
        newValues: params.newValues as any ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
    .catch((err) => {
      logger.error({ err, auditParams: params }, 'Failed to write audit log');
    });
}
