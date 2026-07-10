import prisma from '@/lib/prisma/client'

interface AuditLogParams {
  actorUserId?: string | null
  entityType: string
  entityId?: string | null
  action: string
  beforeJson?: any
  afterJson?: any
  sourceClient: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      actor_user_id: params.actorUserId ?? null,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      action: params.action,
      before_json: params.beforeJson ?? undefined,
      after_json: params.afterJson ?? undefined,
      source_client: params.sourceClient,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    },
  })
}

export function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
    userAgent: request.headers.get('user-agent') || null,
  }
}
