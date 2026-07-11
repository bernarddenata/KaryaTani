import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createWarehouseLocationSchema } from '@/lib/validations/inventory'
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'warehouse_locations.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const warehouse_id = searchParams.get('warehouse_id')
    const cooperative_id = searchParams.get('cooperative_id')
    const location_type = searchParams.get('location_type')
    const status = searchParams.get('status')

    const where: any = {}
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (location_type) where.location_type = location_type
    if (status) where.status = status

    const scopedWhere = await applyCooperativeScope(where, user)

    const [locations, total] = await Promise.all([
      prisma.warehouseLocation.findMany({
        where: scopedWhere,
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          cooperative: { select: { id: true, code: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: [{ warehouse_id: 'asc' }, { code: 'asc' }],
      }),
      prisma.warehouseLocation.count({ where: scopedWhere }),
    ])

    return successResponse(locations, {
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
    if (!hasPermission(user, 'warehouse_locations.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createWarehouseLocationSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { warehouse_id, code, name, location_type, status } = parsed.data

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouse_id },
      select: { id: true, cooperative_id: true },
    })
    if (!warehouse) return notFoundResponse('Gudang tidak ditemukan.')

    if (!(await canAccessCooperative(user, warehouse.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    let location
    try {
      location = await prisma.warehouseLocation.create({
        data: {
          warehouse_id,
          cooperative_id: warehouse.cooperative_id,
          code,
          name,
          location_type,
          status: status || 'AKTIF',
        },
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          cooperative: { select: { id: true, code: true, name: true } },
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return errorResponse('DUPLICATE_CODE', 'Kode lokasi sudah digunakan.', undefined, 409)
      }
      throw err
    }

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'WarehouseLocation',
      entityId: location.id,
      action: 'CREATE',
      afterJson: location,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(location, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
