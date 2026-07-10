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
    if (!hasPermission(user, 'disputes.view')) return forbiddenResponse()

    const { id } = await params

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true, phone: true } },
        farmer_sale: {
          include: {
            commodity: { select: { id: true, name: true, code: true } },
            commodity_variant: { select: { id: true, name: true } },
          },
        },
        qc_result: {
          include: {
            items: {
              include: {
                qc_template_item: true,
              },
            },
            grade_breakdowns: true,
          },
        },
        cooperative: { select: { id: true, code: true, name: true } },
        reviewed_by: { select: { id: true, name: true } },
      },
    })

    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')
    if (!(await canAccessCooperative(user, dispute.cooperative_id)))
      return notFoundResponse('Keberatan tidak ditemukan.')

    return successResponse(dispute)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
