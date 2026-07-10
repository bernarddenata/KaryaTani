import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'audit_logs.view')) return forbiddenResponse()

    const { entityType, entityId } = await params

    const logs = await prisma.auditLog.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    return successResponse(logs)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
