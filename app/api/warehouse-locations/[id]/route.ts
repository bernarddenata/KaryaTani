import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { updateWarehouseLocationSchema } from '@/lib/validations/inventory'
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
    if (!hasPermission(user, 'warehouse_locations.view')) return forbiddenResponse()

    const { id } = await params

    const location = await prisma.warehouseLocation.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        cooperative: { select: { id: true, code: true, name: true } },
      },
    })

    if (!location) return notFoundResponse('Lokasi tidak ditemukan.')
    if (!(await canAccessCooperative(user, location.cooperative_id)))
      return notFoundResponse('Lokasi tidak ditemukan.')

    return successResponse(location)
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
    if (!hasPermission(user, 'warehouse_locations.update')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.warehouseLocation.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Lokasi tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id)))
      return notFoundResponse('Lokasi tidak ditemukan.')

    const body = await request.json()
    const parsed = updateWarehouseLocationSchema.safeParse(body)
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
      updated = await prisma.warehouseLocation.update({
        where: { id },
        data: parsed.data,
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
