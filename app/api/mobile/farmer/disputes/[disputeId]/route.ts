import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { disputeStatus, disputeReasonInfo } from '@/lib/utils/mobile-labels'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { disputeId } = await params

    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, farmer_id: farmer.id },
      include: {
        farmer_sale: {
          select: {
            id: true,
            sale_number: true,
            batch_number: true,
            commodity: { select: { id: true, name: true } },
          },
        },
        reviewed_by: { select: { id: true, name: true } },
      },
    })

    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')

    const status = disputeStatus(dispute.status)
    const reason = disputeReasonInfo(dispute.reason_category)

    const timeline: { status: string; label: string; timestamp: Date }[] = [
      {
        status: 'SUBMITTED',
        label: 'Keberatan dikirim',
        timestamp: dispute.created_at,
      },
    ]
    if (dispute.status === 'DALAM_REVIEW' || dispute.reviewed_by) {
      timeline.push({
        status: 'UNDER_REVIEW',
        label: 'Dalam peninjauan',
        timestamp: dispute.updated_at,
      })
    }
    if (dispute.resolved_at) {
      timeline.push({
        status: status.code,
        label: status.label,
        timestamp: dispute.resolved_at,
      })
    }

    return successResponse({
      dispute_id: dispute.id,
      dispute_number: dispute.dispute_number,
      submission: {
        id: dispute.farmer_sale.id,
        submission_number: dispute.farmer_sale.sale_number,
        batch_number: dispute.farmer_sale.batch_number,
        commodity_name: dispute.farmer_sale.commodity.name,
      },
      reason_category: reason.code,
      reason_label: reason.label,
      farmer_note: dispute.farmer_note,
      status: status.code,
      status_label: status.label,
      manager_decision: dispute.manager_decision,
      resolution_note: dispute.resolution_note,
      reviewed_by: dispute.reviewed_by,
      created_at: dispute.created_at,
      resolved_at: dispute.resolved_at,
      timeline,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
