import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createStockDeliverySchema } from '@/lib/validations/inventory'
import { generateDeliveryNumber } from '@/lib/utils/numbering'
import { deliverStock, StockError } from '@/lib/inventory/service'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const deliveryInclude = {
  cooperative: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_deliveries.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const warehouse_id = searchParams.get('warehouse_id')
    const location_id = searchParams.get('location_id')
    const commodity_id = searchParams.get('commodity_id')
    const status = searchParams.get('status')
    const destination_type = searchParams.get('destination_type')
    const search = searchParams.get('search')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (commodity_id) where.commodity_id = commodity_id
    if (status) where.status = status
    if (destination_type) where.destination_type = destination_type
    if (search) {
      where.OR = [
        { delivery_number: { contains: search, mode: 'insensitive' } },
        { destination_name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (date_from || date_to) {
      where.delivery_date = {}
      if (date_from) where.delivery_date.gte = new Date(date_from)
      if (date_to) where.delivery_date.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [deliveries, total] = await Promise.all([
      prisma.stockDelivery.findMany({
        where: scopedWhere,
        include: deliveryInclude,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.stockDelivery.count({ where: scopedWhere }),
    ])

    return successResponse(deliveries, {
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_deliveries.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createStockDeliverySchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const data = parsed.data

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouse_id },
    })
    if (!warehouse) return notFoundResponse('Gudang tidak ditemukan.')
    if (!(await canAccessCooperative(user, warehouse.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    const location = await prisma.warehouseLocation.findUnique({
      where: { id: data.location_id },
    })
    if (!location || location.warehouse_id !== data.warehouse_id) {
      return validationErrorResponse([
        { field: 'location_id', message: 'Lokasi tidak sesuai dengan gudang yang dipilih.' },
      ])
    }

    const delivery_number = await generateDeliveryNumber()

    const grade_code = data.grade_code || null
    const grade_name = data.grade_name || grade_code

    const delivery = await prisma.stockDelivery.create({
      data: {
        cooperative_id: warehouse.cooperative_id,
        warehouse_id: data.warehouse_id,
        location_id: data.location_id,
        commodity_id: data.commodity_id,
        commodity_variant_id: data.commodity_variant_id || null,
        grade_code,
        grade_name,
        batch_number: data.batch_number || null,
        delivery_number,
        quantity: data.quantity,
        destination_type: data.destination_type,
        destination_name: data.destination_name,
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : undefined,
        notes: data.notes || null,
        document_file_id: data.document_file_id || null,
        proof_file_id: data.proof_file_id || null,
        status: 'DIKIRIM',
        created_by_user_id: user.id,
      },
    })

    let applied = false
    if (hasPermission(user, 'stock_deliveries.complete')) {
      try {
        await deliverStock(delivery.id, user.id)
        applied = true
      } catch (err) {
        if (err instanceof StockError) {
          await prisma.stockDelivery.delete({ where: { id: delivery.id } })
          return errorResponse(err.code, err.message, undefined, 422)
        }
        throw err
      }
    }

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDelivery',
      entityId: delivery.id,
      action: 'CREATE',
      afterJson: delivery,
      sourceClient: 'web',
      ...meta,
    })
    if (applied) {
      await createAuditLog({
        actorUserId: user.id,
        entityType: 'StockDelivery',
        entityId: delivery.id,
        action: 'COMPLETE',
        beforeJson: delivery,
        afterJson: { ...delivery, status: 'SELESAI' },
        sourceClient: 'web',
        ...meta,
      })
    }

    const fresh = await prisma.stockDelivery.findUnique({
      where: { id: delivery.id },
      include: deliveryInclude,
    })

    return successResponse(fresh, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
