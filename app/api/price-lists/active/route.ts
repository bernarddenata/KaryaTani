import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
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
    if (!hasPermission(user, 'price_lists.view')) return forbiddenResponse()

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

    const priceList = await prisma.priceList.findFirst({
      where,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        items: {
          where: commodityId ? { commodity_id: commodityId } : undefined,
          include: {
            commodity: { select: { id: true, code: true, name: true } },
            commodity_variant: { select: { id: true, code: true, name: true } },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { valid_from: 'desc' },
    })

    if (!priceList) return notFoundResponse('Tidak ada daftar harga aktif.')

    return successResponse(priceList)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
