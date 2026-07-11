import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { adjustStock, StockError } from '@/lib/inventory/service'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const adjustmentInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_adjustments.approve')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.stockAdjustment.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Penyesuaian tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    if (existing.status !== 'DIKIRIM') {
      return errorResponse(
        'INVALID_STATUS',
        'Dokumen tidak dalam status yang dapat diproses.',
        undefined,
        409
      )
    }

    try {
      await adjustStock(id, user.id)
    } catch (err) {
      if (err instanceof StockError) {
        return errorResponse(err.code, err.message, undefined, 422)
      }
      throw err
    }

    const updated = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: adjustmentInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockAdjustment',
      entityId: id,
      action: 'APPROVE',
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
