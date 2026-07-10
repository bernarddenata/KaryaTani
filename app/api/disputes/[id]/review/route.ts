import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.dispute.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Keberatan tidak ditemukan.')

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: 'DALAM_REVIEW',
        reviewed_by_user_id: user.id,
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Dispute',
      entityId: dispute.id,
      action: 'REVIEW',
      beforeJson: existing,
      afterJson: dispute,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(dispute)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
