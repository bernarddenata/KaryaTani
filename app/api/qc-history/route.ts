import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_results.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const farmerId = searchParams.get('farmer_id')
    const commodityId = searchParams.get('commodity_id')
    const cooperativeId = searchParams.get('cooperative_id')
    const grade = searchParams.get('grade')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const where: any = {
      status: { in: ['DIKIRIM', 'DISETUJUI'] },
    }
    if (farmerId) where.farmer_id = farmerId
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (grade) where.final_grade_code = grade
    if (commodityId) {
      where.farmer_sale = { commodity_id: commodityId }
    }
    if (dateFrom || dateTo) {
      where.submitted_at = {}
      if (dateFrom) where.submitted_at.gte = new Date(dateFrom)
      if (dateTo) where.submitted_at.lte = new Date(dateTo)
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [results, total] = await Promise.all([
      prisma.qcResult.findMany({
        where: scopedWhere,
        include: {
          farmer_sale: {
            select: {
              id: true,
              sale_number: true,
              batch_number: true,
              received_weight: true,
              commodity: { select: { id: true, name: true, code: true } },
            },
          },
          farmer: { select: { id: true, name: true, farmer_number: true } },
          cooperative: { select: { id: true, name: true } },
          qc_officer: { select: { id: true, name: true } },
          grade_breakdowns: true,
        },
        skip,
        take: limit,
        orderBy: { submitted_at: 'desc' },
      }),
      prisma.qcResult.count({ where: scopedWhere }),
    ])

    return successResponse(results, {
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
