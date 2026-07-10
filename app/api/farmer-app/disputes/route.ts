import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { farmerCreateDisputeSchema } from '@/lib/validations/farmer-app'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where = { farmer_id: farmer.id }

    const [total, disputes] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        include: {
          farmer_sale: {
            select: { id: true, sale_number: true, batch_number: true, status: true },
          },
          cooperative: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(disputes, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const body = await request.json()
    const parsed = farmerCreateDisputeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { farmer_sale_id, reason_category, farmer_note } = parsed.data

    const sale = await prisma.farmerSale.findFirst({
      where: { id: farmer_sale_id, farmer_id: farmer.id },
    })

    if (!sale) return notFoundResponse('Data penjualan tidak ditemukan.')

    const existing = await prisma.dispute.findFirst({
      where: {
        farmer_sale_id,
        farmer_id: farmer.id,
        status: { in: ['DIKIRIM', 'DITINJAU'] },
      },
    })

    if (existing) {
      return errorResponse(
        'DISPUTE_EXISTS',
        'Sudah ada pengajuan keberatan yang sedang diproses untuk penjualan ini.',
        undefined,
        409
      )
    }

    const count = await prisma.dispute.count()
    const disputeNumber = `DSP-${String(count + 1).padStart(6, '0')}`

    const dispute = await prisma.dispute.create({
      data: {
        cooperative_id: sale.cooperative_id,
        farmer_id: farmer.id,
        farmer_sale_id,
        qc_result_id: null,
        dispute_number: disputeNumber,
        reason_category,
        farmer_note,
        status: 'DIKIRIM',
      },
      include: {
        farmer_sale: {
          select: { id: true, sale_number: true, batch_number: true },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      entityType: 'Dispute',
      entityId: dispute.id,
      action: 'CREATE',
      afterJson: dispute,
      sourceClient: 'farmer_app',
      ...meta,
    })

    return successResponse(dispute, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
