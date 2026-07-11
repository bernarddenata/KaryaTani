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

const round3 = (n: number) => Math.round(n * 1000) / 1000

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_reports.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const cooperative_id = searchParams.get('cooperative_id')
    const warehouse_id = searchParams.get('warehouse_id')
    const location_id = searchParams.get('location_id')
    const commodity_id = searchParams.get('commodity_id')
    const grade_code = searchParams.get('grade_code')
    const batch_number = searchParams.get('batch_number')
    const movement_type = searchParams.get('movement_type')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (commodity_id) where.commodity_id = commodity_id
    if (grade_code) where.grade_code = grade_code
    if (batch_number) where.batch_number = batch_number
    if (movement_type) where.movement_type = movement_type
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const movements = await prisma.stockMovement.findMany({
      where: scopedWhere,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, location_type: true } },
        commodity: { select: { id: true, code: true, name: true, default_unit: true } },
        commodity_variant: { select: { id: true, name: true } },
        created_by: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 1000,
    })

    const quantity_in_by_unit: Record<string, number> = {}
    const quantity_out_by_unit: Record<string, number> = {}
    for (const m of movements) {
      quantity_in_by_unit[m.unit] = round3(
        (quantity_in_by_unit[m.unit] || 0) + Number(m.quantity_in)
      )
      quantity_out_by_unit[m.unit] = round3(
        (quantity_out_by_unit[m.unit] || 0) + Number(m.quantity_out)
      )
    }

    return successResponse({
      movements,
      summary: {
        total_rows: movements.length,
        quantity_in_by_unit,
        quantity_out_by_unit,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
