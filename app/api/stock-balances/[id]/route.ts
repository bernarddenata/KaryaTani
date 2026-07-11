import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock.view')) return forbiddenResponse()

    const { id } = await params

    const balance = await prisma.stockBalance.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, location_type: true } },
        commodity: {
          select: { id: true, code: true, name: true, default_unit: true, image_url: true },
        },
        commodity_variant: { select: { id: true, name: true } },
      },
    })

    if (!balance) return notFoundResponse('Saldo stok tidak ditemukan.')
    if (!(await canAccessCooperative(user, balance.cooperative_id)))
      return notFoundResponse('Saldo stok tidak ditemukan.')

    const recentMovements = await prisma.stockMovement.findMany({
      where: {
        cooperative_id: balance.cooperative_id,
        warehouse_id: balance.warehouse_id,
        location_id: balance.location_id,
        commodity_id: balance.commodity_id,
        commodity_variant_id: balance.commodity_variant_id,
        grade_code: balance.grade_code,
        batch_number: balance.batch_number,
        unit: balance.unit,
      },
      include: {
        created_by: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    return successResponse({ ...balance, recent_movements: recentMovements })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
