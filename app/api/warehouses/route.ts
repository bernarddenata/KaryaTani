import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createWarehouseSchema } from '@/lib/validations/inventory'
import { ensureDefaultLocations } from '@/lib/inventory/service'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'warehouses.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const cooperative_id = searchParams.get('cooperative_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (status) where.status = status
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where: scopedWhere,
        include: {
          cooperative: { select: { id: true, code: true, name: true } },
          _count: { select: { locations: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.warehouse.count({ where: scopedWhere }),
    ])

    return successResponse(warehouses, {
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
    if (!hasPermission(user, 'warehouses.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createWarehouseSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { cooperative_id, code, name, address, status } = parsed.data

    if (!(await canAccessCooperative(user, cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke koperasi ini.', undefined, 403)
    }

    let warehouse
    try {
      warehouse = await prisma.$transaction(async (tx) => {
        const created = await tx.warehouse.create({
          data: {
            cooperative_id,
            code,
            name,
            address: address || null,
            status: status || 'AKTIF',
          },
        })
        await ensureDefaultLocations(tx, created.id, cooperative_id)
        return created
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return errorResponse('CONFLICT', 'Kode gudang sudah digunakan.', undefined, 409)
      }
      throw err
    }

    const result = await prisma.warehouse.findUnique({
      where: { id: warehouse.id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        locations: { orderBy: { created_at: 'asc' } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Warehouse',
      entityId: warehouse.id,
      action: 'CREATE',
      afterJson: warehouse,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
