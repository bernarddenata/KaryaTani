import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_wallets.view')) return forbiddenResponse()

    const { id } = await params

    const wallet = await prisma.farmerWallet.findUnique({
      where: { id },
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true, phone: true, seller_type: true } },
        cooperative: { select: { id: true, code: true, name: true } },
        mutations: {
          orderBy: { created_at: 'desc' },
          take: 20,
          include: {
            created_by: { select: { id: true, name: true } },
          },
        },
        payouts: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            paid_by: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!wallet) return notFoundResponse('Dompet petani tidak ditemukan.')
    if (!(await canAccessCooperative(user, wallet.cooperative_id)))
      return notFoundResponse('Dompet petani tidak ditemukan.')

    return successResponse(wallet)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
