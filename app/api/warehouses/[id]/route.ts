import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { updateWarehouseSchema } from '@/lib/validations/inventory'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'warehouses.view')) return forbiddenResponse()

    const { id } = await params

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        locations: { orderBy: { created_at: 'asc' } },
      },
    })

    if (!warehouse) return notFoundResponse('Gudang tidak ditemukan.')
    if (!(await canAccessCooperative(user, warehouse.cooperative_id)))
      return notFoundResponse('Gudang tidak ditemukan.')

    return successResponse(warehouse)
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
    if (!hasPermission(user, 'warehouses.update')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.warehouse.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Gudang tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id)))
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)

    const body = await request.json()
    const parsed = updateWarehouseSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    let updated
    try {
      updated = await prisma.warehouse.update({
        where: { id },
        data: parsed.data,
        include: {
          cooperative: { select: { id: true, code: true, name: true } },
          locations: { orderBy: { created_at: 'asc' } },
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return errorResponse('CONFLICT', 'Kode gudang sudah digunakan.', undefined, 409)
      }
      throw err
    }

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Warehouse',
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
