import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  submissionStatus,
  paymentStatusFromSale,
  disputeReasonInfo,
  disputeStatus,
  toDecimal,
} from '@/lib/utils/mobile-labels'
import { buildSubmissionTimeline, buildEstimatedPayment } from '@/lib/mobile/transforms'
import {
  successResponse,
  unauthorizedResponse,
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
        commodity: {
          select: { id: true, name: true, code: true, default_unit: true, image_url: true },
        },
        commodity_variant: { select: { id: true, name: true } },
        cooperative: { select: { id: true, name: true } },
        representative: { select: { id: true, name: true } },
        received_by: { select: { id: true, name: true } },
        photos: {
          include: {
            file: { select: { id: true, file_url: true, file_name: true, file_type: true } },
          },
          orderBy: { created_at: 'asc' },
        },
        qc_results: {
          include: {
            grade_breakdowns: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        disputes: {
          orderBy: { created_at: 'desc' },
        },
      },
    })

    if (!sale) return notFoundResponse('Setoran tidak ditemukan.')

    const status = submissionStatus(sale.status)
    const latestQc = sale.qc_results[0]
    const activeDispute = sale.disputes.find((d) =>
      ['DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG'].includes(d.status)
    )
    const estimated = buildEstimatedPayment(sale)
    const paymentStatus = paymentStatusFromSale({
      status: sale.status,
      total_amount: sale.total_amount,
      calculated_at: sale.calculated_at,
    })

    return successResponse({
      id: sale.id,
      submission_number: sale.sale_number,
      batch_number: sale.batch_number,
      commodity: {
        id: sale.commodity.id,
        name: sale.commodity.name,
        unit: sale.commodity.default_unit,
        image_url: sale.commodity.image_url,
      },
      commodity_variant: sale.commodity_variant
        ? { id: sale.commodity_variant.id, name: sale.commodity_variant.name }
        : null,
      representative: sale.representative
        ? { id: sale.representative.id, name: sale.representative.name }
        : null,
      cooperative: sale.cooperative,
      initial_weight: toDecimal(sale.initial_weight),
      received_weight: toDecimal(sale.received_weight),
      final_accepted_weight: latestQc ? toDecimal(latestQc.final_accepted_weight) : null,
      rejected_weight: latestQc ? toDecimal(latestQc.total_rejected_weight) : null,
      status: status.code,
      status_label: status.label,
      received_at: sale.received_at,
      created_at: sale.created_at,
      received_by: sale.received_by,
      notes: sale.notes,
      intake_photos: sale.photos
        .filter((p) => p.photo_type === 'INTAKE' || p.photo_type === 'PENERIMAAN')
        .map((p) => ({
          id: p.file.id,
          url: p.file.file_url,
          file_name: p.file.file_name,
          type: 'INTAKE',
        })),
      timeline: buildSubmissionTimeline(sale),
      qc_result_summary: latestQc
        ? {
            qc_result_id: latestQc.id,
            qc_completed_at: latestQc.submitted_at,
            total_rejected_weight: toDecimal(latestQc.total_rejected_weight),
            final_accepted_weight: toDecimal(latestQc.final_accepted_weight),
            final_grade_code: latestQc.final_grade_code,
          }
        : null,
      payment_summary: latestQc || sale.calculated_at
        ? {
            payment_estimation_id: sale.id,
            total_estimated_amount: estimated,
            payment_status: paymentStatus.code,
            payment_status_label: paymentStatus.label,
          }
        : null,
      active_dispute: activeDispute
        ? {
            dispute_id: activeDispute.id,
            dispute_number: activeDispute.dispute_number,
            reason_category: disputeReasonInfo(activeDispute.reason_category).code,
            reason_label: disputeReasonInfo(activeDispute.reason_category).label,
            status: disputeStatus(activeDispute.status).code,
            status_label: disputeStatus(activeDispute.status).label,
            created_at: activeDispute.created_at,
          }
        : null,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
