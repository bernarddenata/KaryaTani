import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { submissionListItem } from '@/lib/mobile/transforms'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const STATUS_INPUT_TO_DB: Record<string, string> = {
  WAITING_QC: 'MENUNGGU_QC',
  QC_IN_PROGRESS: 'QC_DIPROSES',
  QC_COMPLETED: 'QC_SELESAI',
  PAYMENT_PENDING: 'MENUNGGU_PEMBAYARAN',
  PAID: 'DIBAYAR',
  DISPUTED: 'KEBERATAN',
  CANCELLED: 'DIBATALKAN',
}

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status')
    const commodityId = searchParams.get('commodity_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    const where: any = { farmer_id: farmer.id }
    if (rawStatus) {
      where.status = STATUS_INPUT_TO_DB[rawStatus] || rawStatus
    }
    if (commodityId) where.commodity_id = commodityId
    if (startDate || endDate) {
      where.received_at = {}
      if (startDate) where.received_at.gte = new Date(startDate)
      if (endDate) where.received_at.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [total, sales] = await Promise.all([
      prisma.farmerSale.count({ where }),
      prisma.farmerSale.findMany({
        where,
        include: {
          commodity: {
            select: { id: true, name: true, code: true, default_unit: true, image_url: true },
          },
          commodity_variant: { select: { id: true, name: true } },
          cooperative: { select: { id: true, name: true } },
          representative: { select: { id: true, name: true } },
          qc_results: {
            include: { grade_breakdowns: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
          disputes: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(sales.map(submissionListItem), {
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
