import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { disputeListItem } from '@/lib/mobile/transforms'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const STATUS_INPUT_TO_DB: Record<string, string> = {
  SUBMITTED: 'DIKIRIM',
  UNDER_REVIEW: 'DALAM_REVIEW',
  RE_QC_REQUIRED: 'PERLU_QC_ULANG',
  APPROVED: 'DISETUJUI',
  REJECTED: 'DITOLAK',
  CLOSED: 'SELESAI',
}

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    const where: any = { farmer_id: farmer.id }
    if (rawStatus) where.status = STATUS_INPUT_TO_DB[rawStatus] || rawStatus

    const [total, disputes] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        include: {
          farmer_sale: {
            select: {
              id: true,
              sale_number: true,
              batch_number: true,
              commodity: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(disputes.map(disputeListItem), {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
