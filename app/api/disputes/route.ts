import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createDisputeSchema } from '@/lib/validations/dispute'
import { generateDisputeNumber } from '@/lib/utils/numbering'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const farmer_id = searchParams.get('farmer_id')
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (farmer_id) where.farmer_id = farmer_id
    if (status) where.status = status
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where: scopedWhere,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true } },
          farmer_sale: { select: { id: true, sale_number: true, batch_number: true, total_amount: true } },
          reviewed_by: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.dispute.count({ where: scopedWhere }),
    ])

    return successResponse(disputes, {
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createDisputeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { farmer_sale_id, reason_category, farmer_note } = parsed.data

    const sale = await prisma.farmerSale.findUnique({
      where: { id: farmer_sale_id },
      include: {
        qc_results: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Penjualan tidak ditemukan.')

    const dispute_number = await generateDisputeNumber()
    const latestQcResult = sale.qc_results[0]

    const result = await prisma.$transaction(async (tx) => {
      await tx.farmerSale.update({
        where: { id: farmer_sale_id },
        data: { status: 'KEBERATAN' },
      })

      const dispute = await tx.dispute.create({
        data: {
          cooperative_id: sale.cooperative_id,
          farmer_id: sale.farmer_id,
          farmer_sale_id,
          qc_result_id: latestQcResult?.id || null,
          dispute_number,
          reason_category,
          farmer_note,
          status: 'DIKIRIM',
        },
      })

      return dispute
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Dispute',
      entityId: result.id,
      action: 'CREATE',
      afterJson: result,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
