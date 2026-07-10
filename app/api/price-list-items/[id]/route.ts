import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { updatePriceListItemSchema } from '@/lib/validations/price-list'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'price_lists.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.priceListItem.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Item daftar harga tidak ditemukan.')

    const body = await request.json()
    const parsed = updatePriceListItemSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.priceListItem.update({
      where: { id },
      data: parsed.data,
      include: {
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'PriceListItem',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'price_lists.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.priceListItem.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Item daftar harga tidak ditemukan.')

    await prisma.priceListItem.delete({ where: { id } })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'PriceListItem',
      entityId: id,
      action: 'DELETE',
      beforeJson: existing,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
