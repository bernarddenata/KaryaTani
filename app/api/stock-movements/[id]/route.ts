import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
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
    if (!hasPermission(user, 'stock_movements.view')) return forbiddenResponse()

    const { id } = await params

    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, location_type: true } },
        commodity: {
          select: { id: true, code: true, name: true, default_unit: true, image_url: true },
        },
        commodity_variant: { select: { id: true, name: true } },
        created_by: { select: { id: true, name: true } },
      },
    })

    if (!movement) return notFoundResponse('Mutasi stok tidak ditemukan.')
    if (!(await canAccessCooperative(user, movement.cooperative_id)))
      return notFoundResponse('Mutasi stok tidak ditemukan.')

    return successResponse(movement)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
