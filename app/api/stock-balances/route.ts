import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const cooperative_id = searchParams.get('cooperative_id')
    const warehouse_id = searchParams.get('warehouse_id')
    const location_id = searchParams.get('location_id')
    const location_type = searchParams.get('location_type')
    const commodity_id = searchParams.get('commodity_id')
    const commodity_variant_id = searchParams.get('commodity_variant_id')
    const grade_code = searchParams.get('grade_code')
    const batch_number = searchParams.get('batch_number')
    const only_nonzero = searchParams.get('only_nonzero') !== 'false'

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (location_type) where.location = { location_type }
    if (commodity_id) where.commodity_id = commodity_id
    if (commodity_variant_id) where.commodity_variant_id = commodity_variant_id
    if (grade_code) where.grade_code = grade_code
    if (batch_number) where.batch_number = batch_number
    if (only_nonzero) where.quantity = { gt: 0 }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [balances, total] = await Promise.all([
      prisma.stockBalance.findMany({
        where: scopedWhere,
        include: {
          cooperative: { select: { id: true, code: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true, location_type: true } },
          commodity: {
            select: { id: true, code: true, name: true, default_unit: true, image_url: true },
          },
          commodity_variant: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      prisma.stockBalance.count({ where: scopedWhere }),
    ])

    return successResponse(balances, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
