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
    if (!hasPermission(user, 'farmer_wallets.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const cooperative_id = searchParams.get('cooperative_id')
    const farmer_id = searchParams.get('farmer_id')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (farmer_id) where.farmer_id = farmer_id

    const scopedWhere = await applyCooperativeScope(where, user)

    const [wallets, total] = await Promise.all([
      prisma.farmerWallet.findMany({
        where: scopedWhere,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true, phone: true } },
          cooperative: { select: { id: true, code: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      prisma.farmerWallet.count({ where: scopedWhere }),
    ])

    return successResponse(wallets, {
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
