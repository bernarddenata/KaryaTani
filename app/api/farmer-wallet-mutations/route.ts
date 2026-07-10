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
    if (!hasPermission(user, 'farmer_wallet_mutations.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const farmer_id = searchParams.get('farmer_id')
    const wallet_id = searchParams.get('wallet_id')
    const mutation_type = searchParams.get('mutation_type')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (farmer_id) where.farmer_id = farmer_id
    if (wallet_id) where.wallet_id = wallet_id
    if (mutation_type) where.mutation_type = mutation_type
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [mutations, total] = await Promise.all([
      prisma.farmerWalletMutation.findMany({
        where: scopedWhere,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true } },
          cooperative: { select: { id: true, code: true, name: true } },
          created_by: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.farmerWalletMutation.count({ where: scopedWhere }),
    ])

    return successResponse(mutations, {
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
