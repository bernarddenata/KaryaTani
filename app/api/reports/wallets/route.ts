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

    const scopedWhere = await applyCooperativeScope({}, user)

    const wallets = await prisma.farmerWallet.findMany({
      where: scopedWhere,
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true } },
        cooperative: { select: { id: true, name: true } },
      },
      orderBy: { available_balance: 'desc' },
    })

    const summary = await prisma.farmerWallet.aggregate({
      where: scopedWhere,
      _sum: { available_balance: true, held_balance: true, total_paid: true },
      _count: true,
    })

    return successResponse({
      wallets,
      summary: {
        total_wallets: summary._count,
        total_available: summary._sum.available_balance || 0,
        total_held: summary._sum.held_balance || 0,
        total_paid: summary._sum.total_paid || 0,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
