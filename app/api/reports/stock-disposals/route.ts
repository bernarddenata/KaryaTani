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
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (commodity_id) where.commodity_id = commodity_id
    if (grade_code) where.grade_code = grade_code
    if (batch_number) where.batch_number = batch_number
    if (status) where.status = status
    if (date_from || date_to) {
      where.disposal_date = {}
      if (date_from) where.disposal_date.gte = new Date(date_from)
      if (date_to) where.disposal_date.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const disposals = await prisma.stockDisposal.findMany({
      where: scopedWhere,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, location_type: true } },
        commodity: { select: { id: true, code: true, name: true, default_unit: true } },
        commodity_variant: { select: { id: true, name: true } },
        created_by: { select: { id: true, name: true } },
      },
      orderBy: { disposal_date: 'desc' },
      take: 1000,
    })

    // Dokumen pemusnahan tidak menyimpan kolom unit — pakai satuan bawaan komoditas.
    const quantity_by_unit: Record<string, number> = {}
    for (const d of disposals) {
      const unit = d.commodity?.default_unit || 'unit'
      quantity_by_unit[unit] = round3((quantity_by_unit[unit] || 0) + Number(d.quantity))
    }

    return successResponse({
      disposals,
      summary: {
        total_rows: disposals.length,
        quantity_by_unit,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
