import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { paymentStatusFromSale, toDecimal } from '@/lib/utils/mobile-labels'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { submissionId } = await params

    const sale = await prisma.farmerSale.findFirst({
      where: { id: submissionId, farmer_id: farmer.id },
      include: {
        commodity: { select: { name: true, default_unit: true } },
        qc_results: {
          include: {
            grade_breakdowns: { orderBy: { created_at: 'asc' } },
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!sale) return notFoundResponse('Setoran tidak ditemukan.')

    const qc = sale.qc_results[0]
    if (!qc || !qc.submitted_at) {
      return errorResponse(
        'PAYMENT_ESTIMATION_NOT_AVAILABLE',
        'Estimasi pembayaran belum tersedia. Menunggu hasil QC.',
        undefined,
        404
      )
    }

    const breakdown = qc.grade_breakdowns.map((g) => ({
      grade_name: g.grade_name,
      grade_code: g.grade_code,
      weight: toDecimal(g.weight),
      unit: sale.commodity.default_unit,
      price_per_unit: toDecimal(g.price_per_unit),
      amount: toDecimal(g.estimated_amount),
    }))
    const subtotal = breakdown.reduce((sum, b) => sum + b.amount, 0)
    const total = toDecimal(sale.total_amount) || subtotal
    const deduction = subtotal - total > 0 ? subtotal - total : 0

    const paymentStatus = paymentStatusFromSale({
      status: sale.status,
      total_amount: sale.total_amount,
      calculated_at: sale.calculated_at,
    })

    const timeline: { status: string; label: string; timestamp: Date }[] = []
    if (qc.submitted_at) {
      timeline.push({
        status: 'QC_COMPLETED',
        label: 'Hasil QC selesai',
        timestamp: qc.submitted_at,
      })
    }
    if (sale.calculated_at) {
      timeline.push({
        status: 'ESTIMATION_CREATED',
        label: 'Estimasi dibuat',
        timestamp: sale.calculated_at,
      })
    }
    if (sale.status === 'MENUNGGU_PEMBAYARAN') {
      timeline.push({
        status: 'PAYMENT_PENDING',
        label: 'Menunggu pembayaran',
        timestamp: sale.updated_at,
      })
    }
    if (sale.status === 'DIBAYAR') {
      timeline.push({
        status: 'PAID',
        label: 'Pembayaran diterima',
        timestamp: sale.updated_at,
      })
    }

    return successResponse({
      payment_estimation_id: sale.id,
      submission_id: sale.id,
      submission_number: sale.sale_number,
      batch_number: sale.batch_number,
      commodity_name: sale.commodity.name,
      unit: sale.commodity.default_unit,
      subtotal_amount: subtotal,
      deduction_amount: deduction,
      total_estimated_amount: total,
      payment_status: paymentStatus.code,
      payment_status_label: paymentStatus.label,
      calculated_at: sale.calculated_at,
      breakdown,
      timeline,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
