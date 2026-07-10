import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { previewPaymentSchema } from '@/lib/validations/qc-result'
import { loadActivePriceListItems, resolveBreakdownAgainstPriceList } from '@/lib/qc/pricing'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_results.create')) return forbiddenResponse()

    const { saleId } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        cooperative_id: true,
        commodity_id: true,
        received_weight: true,
        price_list_id: true,
        commodity: { select: { default_unit: true, name: true } },
      },
    })
    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Penjualan tidak ditemukan.')

    const body = await request.json()
    const parsed = previewPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const received = Number(sale.received_weight || 0)
    const totalWeight = parsed.data.grade_breakdowns.reduce((s, b) => s + b.weight, 0)
    if (received > 0 && totalWeight > received) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Total berat grade (${totalWeight}) melebihi berat diterima (${received}).`,
        [{ field: 'grade_breakdowns', message: `Total berat melebihi berat diterima.` }],
        422
      )
    }

    const { items, priceListId } = await loadActivePriceListItems(
      sale.cooperative_id,
      sale.commodity_id,
      sale.price_list_id
    )

    if (items.length === 0) {
      return errorResponse(
        'NO_PRICE_LIST',
        'Belum ada daftar harga aktif untuk komoditas ini.',
        undefined,
        409
      )
    }

    const breakdown = parsed.data.grade_breakdowns.map((b) =>
      resolveBreakdownAgainstPriceList(b, items)
    )
    const subtotal = breakdown.reduce((s, b) => s + b.estimated_amount, 0)
    const deduction = parsed.data.deduction_amount || 0
    const total = Math.max(0, subtotal - deduction)

    return successResponse({
      sale_id: sale.id,
      price_list_id: priceListId,
      commodity_name: sale.commodity.name,
      unit: sale.commodity.default_unit,
      subtotal_amount: subtotal,
      deduction_amount: deduction,
      total_estimated_amount: total,
      breakdown: breakdown.map((b) => ({
        grade_id: b.grade_id,
        grade_name: b.grade_name,
        grade_code: b.grade_code,
        weight: b.weight,
        price_per_unit: b.price_per_unit,
        estimated_amount: b.estimated_amount,
        is_reject: b.is_reject,
      })),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
