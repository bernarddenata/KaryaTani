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

    const scopedWhere = await applyCooperativeScope(where, user)

    const [disputes, summary] = await Promise.all([
      prisma.dispute.findMany({
        where: scopedWhere,
        include: {
          farmer: { select: { id: true, name: true } },
          farmer_sale: { select: { id: true, sale_number: true, batch_number: true } },
          reviewed_by: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 500,
      }),
      prisma.dispute.groupBy({
        by: ['status'],
        where: scopedWhere,
        _count: true,
      }),
    ])

    return successResponse({
      disputes,
      summary: {
        by_status: summary.map((s) => ({ status: s.status, count: s._count })),
        total: disputes.length,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
