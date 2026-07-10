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
    if (!hasPermission(user, 'reports.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const commodityVolumes = await prisma.farmerSale.groupBy({
      by: ['commodity_id'],
      where,
      _sum: { received_weight: true, total_amount: true },
      _count: true,
    })

    const commodities = await prisma.commodity.findMany({
      where: {
        id: { in: commodityVolumes.map((c) => c.commodity_id) },
      },
      select: { id: true, name: true, code: true },
    })

    const commodityMap = new Map(commodities.map((c) => [c.id, c]))

    const data = commodityVolumes.map((cv) => ({
      commodity: commodityMap.get(cv.commodity_id) || { id: cv.commodity_id, name: 'Unknown', code: '-' },
      total_weight: cv._sum.received_weight || 0,
      total_amount: cv._sum.total_amount || 0,
      total_sales: cv._count,
    }))

    return successResponse(data)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
