import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  submissionStatus,
  paymentStatusFromSale,
  disputeStatus,
  toDecimal,
} from '@/lib/utils/mobile-labels'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const { batchNumber } = await params

    const sale = await prisma.farmerSale.findFirst({
      where: { batch_number: batchNumber },
      include: {
        farmer: {
          select: { id: true, name: true, farmer_number: true, phone: true, village: true },
        },
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true, default_unit: true } },
        commodity_variant: { select: { id: true, name: true } },
        photos: {
          include: { file: { select: { id: true, file_url: true, file_name: true } } },
          orderBy: { created_at: 'asc' },
        },
        qc_results: {
          include: {
            grade_breakdowns: true,
            qc_officer: { select: { id: true, name: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        disputes: { orderBy: { created_at: 'desc' } },
      },
    })

    if (!sale) return notFoundResponse('Batch tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Batch tidak ditemukan.')

    const [stockBalances, stockMovements] = await Promise.all([
      prisma.stockBalance.findMany({
        where: { batch_number: batchNumber, quantity: { gt: 0 } },
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true, location_type: true } },
          commodity: { select: { id: true, name: true, default_unit: true } },
        },
      }),
      prisma.stockMovement.findMany({
        where: { batch_number: batchNumber },
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true, location_type: true } },
          created_by: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'asc' },
      }),
    ])

    const status = submissionStatus(sale.status)
    const qc = sale.qc_results[0]
    const payment = paymentStatusFromSale({
      status: sale.status,
      total_amount: sale.total_amount,
      calculated_at: sale.calculated_at,
    })

    const timeline: { status: string; label: string; timestamp: Date | null }[] = []
    timeline.push({
      status: 'SUBMISSION_CREATED',
      label: 'Setoran dibuat',
      timestamp: sale.created_at,
    })
    if (sale.received_at) {
      timeline.push({
        status: 'SUBMISSION_RECEIVED',
        label: 'Setoran diterima',
        timestamp: sale.received_at,
      })
    }
    if (qc?.submitted_at) {
      timeline.push({
        status: 'QC_COMPLETED',
        label: 'QC selesai',
        timestamp: qc.submitted_at,
      })
    }
    if (sale.calculated_at) {
      timeline.push({
        status: 'ESTIMATION_CREATED',
        label: 'Estimasi pembayaran dibuat',
        timestamp: sale.calculated_at,
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
      batch_number: sale.batch_number,
      current_status: status.code,
      current_status_label: status.label,
      submission: {
        id: sale.id,
        submission_number: sale.sale_number,
        batch_number: sale.batch_number,
        initial_weight: toDecimal(sale.initial_weight),
        received_weight: toDecimal(sale.received_weight),
        received_at: sale.received_at,
        created_at: sale.created_at,
        status: status.code,
        status_label: status.label,
        notes: sale.notes,
      },
      farmer: sale.farmer,
      commodity: sale.commodity,
      commodity_variant: sale.commodity_variant,
      cooperative: sale.cooperative,
      qc_result: qc
        ? {
            qc_result_id: qc.id,
            qc_officer: qc.qc_officer,
            submitted_at: qc.submitted_at,
            final_grade_code: qc.final_grade_code,
            total_weight_checked: toDecimal(qc.total_weight_checked),
            final_accepted_weight: toDecimal(qc.final_accepted_weight),
            total_rejected_weight: toDecimal(qc.total_rejected_weight),
            grade_breakdown: qc.grade_breakdowns.map((g) => ({
              grade_name: g.grade_name,
              grade_code: g.grade_code,
              weight: toDecimal(g.weight),
              price_per_unit: toDecimal(g.price_per_unit),
              estimated_amount: toDecimal(g.estimated_amount),
            })),
          }
        : null,
      payment_estimation: qc || sale.calculated_at
        ? {
            total_estimated_amount: toDecimal(sale.total_amount),
            payment_status: payment.code,
            payment_status_label: payment.label,
            calculated_at: sale.calculated_at,
          }
        : null,
      photos: sale.photos.map((p) => ({
        id: p.file.id,
        url: p.file.file_url,
        file_name: p.file.file_name,
        type: p.photo_type,
      })),
      disputes: sale.disputes.map((d) => {
        const dstatus = disputeStatus(d.status)
        return {
          id: d.id,
          dispute_number: d.dispute_number,
          status: dstatus.code,
          status_label: dstatus.label,
          created_at: d.created_at,
          resolved_at: d.resolved_at,
        }
      }),
      inventory: {
        balances: stockBalances,
        movements: stockMovements,
      },
      timeline,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
