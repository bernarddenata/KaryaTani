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
    if (!hasPermission(user, 'qc_results.view')) return forbiddenResponse()

    const { id } = await params

    const qcResult = await prisma.qcResult.findUnique({
      where: { id },
      include: {
        farmer_sale: {
          select: {
            id: true,
            sale_number: true,
            batch_number: true,
            received_weight: true,
            status: true,
          },
        },
        farmer: { select: { id: true, name: true, farmer_number: true } },
        cooperative: { select: { id: true, name: true } },
        qc_template: {
          select: {
            id: true,
            name: true,
            items: { orderBy: { sort_order: 'asc' } },
          },
        },
        qc_officer: { select: { id: true, name: true } },
        items: {
          include: {
            qc_template_item: true,
          },
        },
        grade_breakdowns: {
          orderBy: { grade_code: 'asc' },
        },
      },
    })

    if (!qcResult) return notFoundResponse('Hasil QC tidak ditemukan.')
    if (!(await canAccessCooperative(user, qcResult.cooperative_id)))
      return notFoundResponse('Hasil QC tidak ditemukan.')

    return successResponse(qcResult)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
