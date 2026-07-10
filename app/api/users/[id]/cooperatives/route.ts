import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createUserCooperativeSchema } from '@/lib/validations/user-cooperative'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'users.view')) return forbiddenResponse()

    const { id: userId } = await params
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!targetUser) return notFoundResponse('Pengguna tidak ditemukan.')

    const assignments = await prisma.userCooperative.findMany({
      where: { user_id: userId },
      include: {
        cooperative: { select: { id: true, code: true, name: true, status: true } },
      },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    })

    return successResponse(assignments)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'users.edit') && !hasPermission(user, 'users.update')) {
      return forbiddenResponse()
    }

    const { id: userId } = await params
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    if (!targetUser) return notFoundResponse('Pengguna tidak ditemukan.')

    const body = await request.json()
    const parsed = createUserCooperativeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const coop = await prisma.cooperative.findUnique({
      where: { id: parsed.data.cooperative_id },
      select: { id: true, name: true },
    })
    if (!coop) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Koperasi tidak ditemukan.',
        [{ field: 'cooperative_id', message: 'Koperasi tidak ditemukan.' }],
        422
      )
    }

    const existing = await prisma.userCooperative.findFirst({
      where: { user_id: userId, cooperative_id: parsed.data.cooperative_id },
    })
    if (existing) {
      return errorResponse(
        'CONFLICT',
        'Pengguna sudah dipetakan ke koperasi ini.',
        undefined,
        409
      )
    }

    const created = await prisma.$transaction(async (tx) => {
      if (parsed.data.is_primary) {
        await tx.userCooperative.updateMany({
          where: { user_id: userId, is_primary: true },
          data: { is_primary: false },
        })
      }
      return tx.userCooperative.create({
        data: {
          user_id: userId,
          cooperative_id: parsed.data.cooperative_id,
          assignment_type: parsed.data.assignment_type,
          is_primary: parsed.data.is_primary ?? false,
          status: parsed.data.status ?? 'AKTIF',
        },
        include: {
          cooperative: { select: { id: true, code: true, name: true, status: true } },
        },
      })
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'UserCooperative',
      entityId: created.id,
      action: 'ASSIGN_COOPERATIVE',
      afterJson: {
        user_id: userId,
        user_name: targetUser.name,
        cooperative_id: coop.id,
        cooperative_name: coop.name,
        assignment_type: created.assignment_type,
        is_primary: created.is_primary,
      },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(created, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
