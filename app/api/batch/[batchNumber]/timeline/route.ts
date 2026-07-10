import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const { batchNumber } = await params

    const sale = await prisma.farmerSale.findFirst({
      where: { batch_number: batchNumber },
    })

    if (!sale) return notFoundResponse('Batch tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Batch tidak ditemukan.')

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'FarmerSale',
        entity_id: sale.id,
      },
      include: {
        actor: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    return successResponse(auditLogs)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
