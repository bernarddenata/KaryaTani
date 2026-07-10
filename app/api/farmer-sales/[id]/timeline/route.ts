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
    if (!hasPermission(user, 'farmer_sales.view')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({ where: { id } })
    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Penjualan tidak ditemukan.')

    const logs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'FarmerSale',
        entity_id: id,
      },
      orderBy: { created_at: 'desc' },
      include: {
        actor: { select: { id: true, name: true } },
      },
    })

    return successResponse(logs)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
