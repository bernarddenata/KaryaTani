import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { mobileCreateDisputeSchema } from '@/lib/validations/mobile-farmer'
import { normalizeDisputeReason, disputeStatus } from '@/lib/utils/mobile-labels'
import { generateDisputeNumber } from '@/lib/utils/numbering'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const DISPUTE_ELIGIBLE_STATUSES = new Set([
  'QC_SELESAI',
  'HARGA_DIHITUNG',
  'MENUNGGU_PEMBAYARAN',
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { submissionId } = await params
    const body = await request.json()
    const parsed = mobileCreateDisputeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const sale = await prisma.farmerSale.findFirst({
      where: { id: submissionId, farmer_id: farmer.id },
      include: {
        qc_results: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!sale) return notFoundResponse('Setoran tidak ditemukan.')

    if (!DISPUTE_ELIGIBLE_STATUSES.has(sale.status)) {
      return errorResponse(
        'SUBMISSION_NOT_ELIGIBLE_FOR_DISPUTE',
        'Setoran tidak dapat diajukan keberatan pada status saat ini.',
        undefined,
        409
      )
    }

    const existing = await prisma.dispute.findFirst({
      where: {
        farmer_sale_id: submissionId,
        farmer_id: farmer.id,
        status: { in: ['DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG'] },
      },
    })
    if (existing) {
      return errorResponse(
        'ACTIVE_DISPUTE_ALREADY_EXISTS',
        'Sudah ada keberatan aktif untuk setoran ini.',
        undefined,
        409
      )
    }

    const dbReason = normalizeDisputeReason(parsed.data.reason_category)
    const disputeNumber = await generateDisputeNumber()
    const latestQc = sale.qc_results[0]

    const dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          cooperative_id: sale.cooperative_id,
          farmer_id: farmer.id,
          farmer_sale_id: sale.id,
          qc_result_id: latestQc?.id || null,
          dispute_number: disputeNumber,
          reason_category: dbReason,
          farmer_note: parsed.data.farmer_note,
          status: 'DIKIRIM',
        },
      })

      await tx.farmerSale.update({
        where: { id: sale.id },
        data: { status: 'KEBERATAN' },
      })

      await tx.notification.create({
        data: {
          farmer_id: farmer.id,
          title: 'Keberatan berhasil dikirim',
          message: `Keberatan ${created.dispute_number} untuk setoran ${sale.sale_number} sedang menunggu peninjauan pengurus koperasi.`,
          notification_type: 'DISPUTE_SUBMITTED',
          related_entity_type: 'Dispute',
          related_entity_id: created.id,
        },
      })

      return created
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      entityType: 'Dispute',
      entityId: dispute.id,
      action: 'CREATE',
      afterJson: dispute,
      sourceClient: 'mobile_farmer',
      ...meta,
    })

    const status = disputeStatus(dispute.status)
    return successResponse(
      {
        dispute_id: dispute.id,
        dispute_number: dispute.dispute_number,
        submission_id: sale.id,
        status: status.code,
        status_label: status.label,
        created_at: dispute.created_at,
      },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
