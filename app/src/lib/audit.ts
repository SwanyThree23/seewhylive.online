import { prisma } from '@/lib/db'

interface AuditParams {
  actorId: string
  action: string
  targetId?: string
  targetType?: string
  meta?: Record<string, unknown>
  ipAddress?: string
}

// AuditLogs is append-only — never update or delete rows from this table.
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.actorId,
        action: params.action,
        resourceType: params.targetType,
        resourceId: params.targetId,
        metadata: params.meta as never,
        ipAddress: params.ipAddress,
      },
    })
  } catch {
    // Audit failures must never crash the main request; log to stderr only.
    console.error('[AUDIT] Failed to write audit log', params.action)
  }
}
