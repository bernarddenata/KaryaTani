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

    const where: any = {
      quantity: { gt: 0 },
      location: { location_type: 'STOK_RUSAK' },
    }
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (commodity_id) where.commodity_id = commodity_id
    if (grade_code) where.grade_code = grade_code
    if (batch_number) where.batch_number = batch_number

    const scopedWhere = await applyCooperativeScope(where, user)

    const balances = await prisma.stockBalance.findMany({
      where: scopedWhere,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, location_type: true } },
        commodity: { select: { id: true, code: true, name: true, default_unit: true } },
        commodity_variant: { select: { id: true, name: true } },
      },
      orderBy: { updated_at: 'desc' },
      take: 1000,
    })

    const quantity_by_unit: Record<string, number> = {}
    for (const b of balances) {
      quantity_by_unit[b.unit] = round3((quantity_by_unit[b.unit] || 0) + Number(b.quantity))
    }

    return successResponse({
      balances,
      summary: {
        total_rows: balances.length,
        quantity_by_unit,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
