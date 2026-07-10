import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.edit')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    if (sale.status === 'DIBAYAR' || sale.status === 'DIBATALKAN') {
      return errorResponse(
        'INVALID_STATUS',
        'Penjualan tidak dapat dibatalkan pada status ini.'
      )
    }

    const updated = await prisma.farmerSale.update({
      where: { id },
      data: { status: 'DIBATALKAN' },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerSale',
      entityId: id,
      action: 'CANCEL',
      beforeJson: sale,
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
