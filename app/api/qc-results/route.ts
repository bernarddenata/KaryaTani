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
    const status = searchParams.get('status')
    const farmerId = searchParams.get('farmer_id')
    const cooperativeId = searchParams.get('cooperative_id')
    const qcOfficerUserId = searchParams.get('qc_officer_user_id')

    const where: any = {}
    if (status) where.status = status
    if (farmerId) where.farmer_id = farmerId
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (qcOfficerUserId) where.qc_officer_user_id = qcOfficerUserId

    const scopedWhere = await applyCooperativeScope(where, user)

    const [results, total] = await Promise.all([
      prisma.qcResult.findMany({
        where: scopedWhere,
        include: {
          farmer_sale: { select: { id: true, sale_number: true, batch_number: true } },
          farmer: { select: { id: true, name: true } },
          cooperative: { select: { id: true, name: true } },
          qc_template: { select: { id: true, name: true } },
          qc_officer: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
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
