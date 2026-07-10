import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { updatePriceListSchema } from '@/lib/validations/price-list'
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

    const priceList = await prisma.priceList.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        items: {
          include: {
            commodity: { select: { id: true, code: true, name: true } },
            commodity_variant: { select: { id: true, code: true, name: true } },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    if (!priceList) return notFoundResponse('Daftar harga tidak ditemukan.')
    if (!(await canAccessCooperative(user, priceList.cooperative_id)))
      return notFoundResponse('Daftar harga tidak ditemukan.')

    return successResponse(priceList)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'price_lists.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.priceList.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Daftar harga tidak ditemukan.')

    const body = await request.json()
    const parsed = updatePriceListSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updateData: any = { ...parsed.data }
    if (parsed.data.valid_from) updateData.valid_from = new Date(parsed.data.valid_from)
    if (parsed.data.valid_until) updateData.valid_until = new Date(parsed.data.valid_until)

    const updated = await prisma.priceList.update({
      where: { id },
      data: updateData,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        items: {
          include: {
            commodity: { select: { id: true, code: true, name: true } },
            commodity_variant: { select: { id: true, code: true, name: true } },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'PriceList',
      entityId: id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: updated,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
