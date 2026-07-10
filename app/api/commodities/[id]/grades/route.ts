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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'price_lists.view')) return forbiddenResponse()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const cooperativeId = searchParams.get('cooperative_id')

    const commodity = await prisma.commodity.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, default_unit: true },
    })
    if (!commodity) return notFoundResponse('Komoditas tidak ditemukan.')

    const now = new Date()
    const priceList = await prisma.priceList.findFirst({
      where: {
        status: 'AKTIF',
        valid_from: { lte: now },
        OR: [{ valid_until: null }, { valid_until: { gte: now } }],
        ...(cooperativeId ? { cooperative_id: cooperativeId } : {}),
        items: { some: { commodity_id: id } },
      },
      include: {
        items: {
          where: { commodity_id: id },
          orderBy: { sort_order: 'asc' },
        },
        cooperative: { select: { id: true, name: true } },
      },
      orderBy: { valid_from: 'desc' },
    })

    if (!priceList) {
      return successResponse({
        commodity,
        price_list: null,
        grades: [],
      })
    }

    return successResponse({
      commodity,
      price_list: {
        id: priceList.id,
        name: priceList.name,
        valid_from: priceList.valid_from,
        valid_until: priceList.valid_until,
        cooperative: priceList.cooperative,
      },
      grades: priceList.items.map((item) => ({
        id: item.id,
        grade_name: item.grade_name,
        grade_code: item.grade_code,
        price_per_unit: Number(item.price_per_unit),
        unit: item.unit,
        is_reject: item.is_reject,
        sort_order: item.sort_order,
      })),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
