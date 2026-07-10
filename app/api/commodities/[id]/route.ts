import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createCommoditySchema } from '@/lib/validations/commodity'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
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
    if (!hasPermission(user, 'commodities.view')) return forbiddenResponse()

    const { id } = await params

    const commodity = await prisma.commodity.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    })

    if (!commodity) return notFoundResponse('Komoditas tidak ditemukan.')

    return successResponse(commodity)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'commodities.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.commodity.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Komoditas tidak ditemukan.')

    const body = await request.json()
    const parsed = createCommoditySchema.partial().safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.commodity.update({
      where: { id },
      data: parsed.data,
      include: {
        variants: true,
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Commodity',
      entityId: id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: updated,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
