import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { deliverStock, StockError } from '@/lib/inventory/service'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const deliveryInclude = {
  cooperative: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_deliveries.complete')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.stockDelivery.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Pengiriman tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id)))
      return notFoundResponse('Pengiriman tidak ditemukan.')

    if (existing.status !== 'DIKIRIM') {
      return errorResponse(
        'INVALID_STATUS',
        'Dokumen tidak dalam status yang dapat diproses.',
        undefined,
        409
      )
    }

    try {
      await deliverStock(id, user.id)
    } catch (err) {
      if (err instanceof StockError) {
        return errorResponse(err.code, err.message, undefined, 422)
      }
      throw err
    }

    const updated = await prisma.stockDelivery.findUnique({
      where: { id },
      include: deliveryInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDelivery',
      entityId: id,
      action: 'COMPLETE',
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
