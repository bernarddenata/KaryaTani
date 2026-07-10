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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmers.view')) return forbiddenResponse()

    const { id } = await params

    const wallets = await prisma.farmerWallet.findMany({
      where: { farmer_id: id },
      include: {
        cooperative: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return successResponse(wallets)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
