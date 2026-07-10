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
    if (!hasPermission(user, 'farmers.view')) return forbiddenResponse()

    const { id } = await params

    const farmer = await prisma.farmer.findUnique({
      where: { id },
      select: { cooperative_id: true },
    })
    if (!farmer) return notFoundResponse('Petani tidak ditemukan.')
    if (!(await canAccessCooperative(user, farmer.cooperative_id)))
      return notFoundResponse('Petani tidak ditemukan.')

    const qcResults = await prisma.qcResult.findMany({
      where: { farmer_id: id },
      include: {
        farmer_sale: {
          select: { id: true, sale_number: true, batch_number: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return successResponse(qcResults)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
