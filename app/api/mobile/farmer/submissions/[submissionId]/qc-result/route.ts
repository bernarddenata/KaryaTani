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
            items: {
              include: {
                qc_template_item: {
                  select: { item_name: true, item_code: true, input_type: true },
                },
                proof_file: { select: { id: true, file_url: true, file_name: true } },
              },
              orderBy: { created_at: 'asc' },
            },
            qc_officer: { select: { id: true, name: true } },
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
        'QC_RESULT_NOT_AVAILABLE',
        'Hasil QC belum tersedia untuk setoran ini.',
        undefined,
        404
      )
    }

    const totalEstimated = qc.grade_breakdowns.reduce(
      (sum, g) => sum + toDecimal(g.estimated_amount),
      0
    )
    const paymentStatus = paymentStatusFromSale({
      status: sale.status,
      total_amount: sale.total_amount,
      calculated_at: sale.calculated_at,
    })

    const evidencePhotos = qc.items
      .filter((it) => it.proof_file)
      .map((it) => ({
        id: it.proof_file!.id,
        url: it.proof_file!.file_url,
        file_name: it.proof_file!.file_name,
        type: 'QC_EVIDENCE',
      }))

    return successResponse({
      qc_result_id: qc.id,
      submission_id: sale.id,
      submission_number: sale.sale_number,
      batch_number: sale.batch_number,
      commodity: {
        name: sale.commodity.name,
        unit: sale.commodity.default_unit,
      },
      qc_officer: qc.qc_officer,
      qc_completed_at: qc.submitted_at,
      received_weight: toDecimal(qc.total_weight_checked ?? sale.received_weight),
      final_accepted_weight: toDecimal(qc.final_accepted_weight),
      total_rejected_weight: toDecimal(qc.total_rejected_weight),
      final_grade_code: qc.final_grade_code,
      recommended_grade_code: qc.recommended_grade_code,
      overall_notes: qc.notes,
      grade_breakdown: qc.grade_breakdowns.map((g) => ({
        grade_id: g.id,
        grade_name: g.grade_name,
        grade_code: g.grade_code,
        weight: toDecimal(g.weight),
        price_per_unit: toDecimal(g.price_per_unit),
        estimated_amount: toDecimal(g.estimated_amount),
        reason: g.reason,
      })),
      qc_parameters: qc.items.map((it) => ({
        parameter_name: it.qc_template_item.item_name,
        parameter_code: it.qc_template_item.item_code,
        input_type: it.qc_template_item.input_type,
        value: it.value_number !== null && it.value_number !== undefined
          ? it.value_number
          : it.value_text,
        unit: null,
        notes: it.notes,
      })),
      evidence_photos: evidencePhotos,
      payment_summary: {
        total_estimated_amount: totalEstimated,
        payment_status: paymentStatus.code,
        payment_status_label: paymentStatus.label,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
