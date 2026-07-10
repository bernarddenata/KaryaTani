import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const updateVariantSchema = z
  .object({
    commodity_id: z.string().min(1, 'ID komoditas wajib diisi.'),
    code: z.string().min(1, 'Kode varian wajib diisi.'),
    name: z.string().min(1, 'Nama varian wajib diisi.'),
    unit: z.string().min(1, 'Satuan wajib diisi.'),
    description: z.string().optional(),
  })
  .partial()
  .omit({ commodity_id: true })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'commodities.view')) return forbiddenResponse()

    const { id } = await params

    const variant = await prisma.commodityVariant.findUnique({
      where: { id },
      include: {
        commodity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    if (!variant)
      return notFoundResponse('Varian komoditas tidak ditemukan.')

    return successResponse(variant)
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
    if (!hasPermission(user, 'commodities.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.commodityVariant.findUnique({
      where: { id },
    })
    if (!existing)
      return notFoundResponse('Varian komoditas tidak ditemukan.')

    const body = await request.json()
    const parsed = updateVariantSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.commodityVariant.update({
      where: { id },
      data: parsed.data,
      include: {
        commodity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'CommodityVariant',
      entityId: updated.id,
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
