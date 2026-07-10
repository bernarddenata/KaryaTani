import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createPriceListItemSchema } from '@/lib/validations/price-list'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
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

    const priceList = await prisma.priceList.findUnique({ where: { id } })
    if (!priceList) return notFoundResponse('Daftar harga tidak ditemukan.')
    if (!(await canAccessCooperative(user, priceList.cooperative_id)))
      return notFoundResponse('Daftar harga tidak ditemukan.')

    const items = await prisma.priceListItem.findMany({
      where: { price_list_id: id },
      include: {
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
      },
      orderBy: { sort_order: 'asc' },
    })

    return successResponse(items)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'price_lists.edit')) return forbiddenResponse()

    const { id } = await params

    const priceList = await prisma.priceList.findUnique({ where: { id } })
    if (!priceList) return notFoundResponse('Daftar harga tidak ditemukan.')

    const body = await request.json()
    const parsed = createPriceListItemSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const item = await prisma.priceListItem.create({
      data: {
        price_list_id: id,
        commodity_id: parsed.data.commodity_id,
        commodity_variant_id: parsed.data.commodity_variant_id || null,
        grade_name: parsed.data.grade_name,
        grade_code: parsed.data.grade_code,
        price_per_unit: parsed.data.price_per_unit,
        unit: parsed.data.unit,
        is_reject: parsed.data.is_reject ?? false,
        sort_order: parsed.data.sort_order ?? 0,
      },
      include: {
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'PriceListItem',
      entityId: item.id,
      action: 'CREATE',
      afterJson: item,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(item, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
