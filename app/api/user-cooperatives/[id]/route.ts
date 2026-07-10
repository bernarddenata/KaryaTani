import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { updateUserCooperativeSchema } from '@/lib/validations/user-cooperative'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

function canManageUsers(user: any): boolean {
  return hasPermission(user, 'users.edit') || hasPermission(user, 'users.update')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!canManageUsers(user)) return forbiddenResponse()

    const { id } = await params
    const existing = await prisma.userCooperative.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })
    if (!existing) return notFoundResponse('Pemetaan tidak ditemukan.')

    const body = await request.json()
    const parsed = updateUserCooperativeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.is_primary === true) {
        await tx.userCooperative.updateMany({
          where: { user_id: existing.user_id, is_primary: true, id: { not: id } },
          data: { is_primary: false },
        })
      }
      return tx.userCooperative.update({
        where: { id },
        data: parsed.data,
        include: {
          cooperative: { select: { id: true, code: true, name: true, status: true } },
        },
      })
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'UserCooperative',
      entityId: id,
      action: 'UPDATE_ASSIGNMENT',
      beforeJson: {
        assignment_type: existing.assignment_type,
        is_primary: existing.is_primary,
        status: existing.status,
      },
      afterJson: {
        assignment_type: updated.assignment_type,
        is_primary: updated.is_primary,
        status: updated.status,
      },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!canManageUsers(user)) return forbiddenResponse()

    const { id } = await params
    const existing = await prisma.userCooperative.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })
    if (!existing) return notFoundResponse('Pemetaan tidak ditemukan.')

    await prisma.userCooperative.delete({ where: { id } })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'UserCooperative',
      entityId: id,
      action: 'REMOVE_ASSIGNMENT',
      beforeJson: {
        user_id: existing.user_id,
        user_name: existing.user.name,
        cooperative_id: existing.cooperative_id,
        cooperative_name: existing.cooperative.name,
        assignment_type: existing.assignment_type,
        is_primary: existing.is_primary,
      },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
