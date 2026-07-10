import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_templates.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const cooperativeId = searchParams.get('cooperative_id')
    const commodityId = searchParams.get('commodity_id')

    const where: any = {
      status: 'AKTIF',
      valid_from: { lte: new Date() },
      OR: [
        { valid_until: null },
        { valid_until: { gte: new Date() } },
      ],
    }
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (commodityId) where.commodity_id = commodityId

    const scopedWhere = await applyCooperativeScope(where, user)

    const template = await prisma.qcTemplate.findFirst({
      where: scopedWhere,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
        items: {
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { valid_from: 'desc' },
    })

    if (!template) return notFoundResponse('Tidak ada template QC aktif.')

    return successResponse(template)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
