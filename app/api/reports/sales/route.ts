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
    const cooperative_id = searchParams.get('cooperative_id')
    const commodity_id = searchParams.get('commodity_id')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (commodity_id) where.commodity_id = commodity_id
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const [sales, totalCount, summary] = await Promise.all([
      prisma.farmerSale.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true } },
          cooperative: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, code: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 500,
      }),
      prisma.farmerSale.count({ where }),
      prisma.farmerSale.aggregate({
        where,
        _sum: { total_amount: true, received_weight: true },
        _count: true,
      }),
    ])

    return successResponse({
      sales,
      summary: {
        total_count: totalCount,
        total_amount: summary._sum.total_amount || 0,
        total_weight: summary._sum.received_weight || 0,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
