import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { updatePayoutSchema } from '@/lib/validations/payout'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
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
    if (!hasPermission(user, 'farmer_payouts.view')) return forbiddenResponse()

    const { id } = await params

    const payout = await prisma.farmerPayout.findUnique({
      where: { id },
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true, phone: true } },
        cooperative: { select: { id: true, code: true, name: true } },
        wallet: { select: { id: true, available_balance: true, held_balance: true, total_paid: true } },
        paid_by: { select: { id: true, name: true } },
        proof_file: true,
      },
    })

    if (!payout) return notFoundResponse('Pembayaran tidak ditemukan.')
    if (!(await canAccessCooperative(user, payout.cooperative_id)))
      return notFoundResponse('Pembayaran tidak ditemukan.')

    return successResponse(payout)
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
    if (!hasPermission(user, 'farmer_payouts.edit')) return forbiddenResponse()

    const { id } = await params
    const body = await request.json()
    const parsed = updatePayoutSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const existing = await prisma.farmerPayout.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Pembayaran tidak ditemukan.')

    const payout = await prisma.farmerPayout.update({
      where: { id },
      data: parsed.data,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerPayout',
      entityId: payout.id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: payout,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(payout)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
