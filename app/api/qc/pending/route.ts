import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
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
    const cooperativeId = searchParams.get('cooperative_id')
    const commodityId = searchParams.get('commodity_id')

    const where: any = {
      status: { in: ['MENUNGGU_QC', 'DITERIMA_KOPERASI'] },
    }
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (commodityId) where.commodity_id = commodityId

    const [sales, total] = await Promise.all([
      prisma.farmerSale.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true } },
          commodity: { select: { id: true, name: true, code: true } },
          cooperative: { select: { id: true, name: true } },
          commodity_variant: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
      }),
      prisma.farmerSale.count({ where }),
    ])

    return successResponse(sales, {
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
