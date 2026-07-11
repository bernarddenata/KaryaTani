import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createStockDeliverySchema } from '@/lib/validations/inventory'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const updateStockDeliverySchema = createStockDeliverySchema
  .omit({ warehouse_id: true })
  .partial()

const deliveryInclude = {
  cooperative: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
  document_file: true,
  proof_file: true,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_deliveries.view')) return forbiddenResponse()

    const { id } = await params

    const delivery = await prisma.stockDelivery.findUnique({
      where: { id },
      include: deliveryInclude,
    })

    if (!delivery) return notFoundResponse('Pengiriman tidak ditemukan.')
    if (!(await canAccessCooperative(user, delivery.cooperative_id)))
      return notFoundResponse('Pengiriman tidak ditemukan.')

    return successResponse(delivery)
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
    if (!hasPermission(user, 'stock_deliveries.create')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.stockDelivery.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Pengiriman tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id)))
      return notFoundResponse('Pengiriman tidak ditemukan.')

    if (existing.status !== 'DRAFT' && existing.status !== 'DIKIRIM') {
      return errorResponse(
        'INVALID_STATUS',
        'Pengiriman tidak dapat diubah pada status ini.',
        undefined,
        409
      )
    }

    const body = await request.json()
    const parsed = updateStockDeliverySchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const data = parsed.data

    if (data.location_id) {
      const location = await prisma.warehouseLocation.findUnique({
        where: { id: data.location_id },
      })
      if (!location || location.warehouse_id !== existing.warehouse_id) {
        return validationErrorResponse([
          { field: 'location_id', message: 'Lokasi tidak sesuai dengan gudang yang dipilih.' },
        ])
      }
    }

    const updateData: any = { ...data }
    if (data.delivery_date !== undefined) {
      updateData.delivery_date = data.delivery_date ? new Date(data.delivery_date) : undefined
    }
    const grade_code = data.grade_code !== undefined ? data.grade_code : existing.grade_code
    const grade_name = data.grade_name !== undefined ? data.grade_name : existing.grade_name
    if (grade_code && !grade_name) {
      updateData.grade_name = grade_code
    }

    const updated = await prisma.stockDelivery.update({
      where: { id },
      data: updateData,
      include: deliveryInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDelivery',
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
