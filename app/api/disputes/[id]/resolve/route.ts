import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { resolveDisputeSchema } from '@/lib/validations/dispute'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.edit')) return forbiddenResponse()

    const { id } = await params
    const body = await request.json()
    const parsed = resolveDisputeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const existing = await prisma.dispute.findUnique({
      where: { id },
      include: { farmer_sale: true },
    })
    if (!existing) return notFoundResponse('Keberatan tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id)))
      return notFoundResponse('Keberatan tidak ditemukan.')

    const { manager_decision, resolution_note, status, adjustment_amount } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.update({
        where: { id },
        data: {
          status,
          manager_decision,
          resolution_note: resolution_note || null,
          resolved_at: new Date(),
        },
      })

      if (adjustment_amount && adjustment_amount > 0 && status === 'DISETUJUI') {
        const wallet = await tx.farmerWallet.findFirst({
          where: {
            farmer_id: existing.farmer_id,
            cooperative_id: existing.cooperative_id,
          },
        })

        if (wallet) {
          const balanceBefore = Number(wallet.available_balance)
          const balanceAfter = balanceBefore + adjustment_amount

          await tx.farmerWalletMutation.create({
            data: {
              cooperative_id: existing.cooperative_id,
              farmer_id: existing.farmer_id,
              wallet_id: wallet.id,
              mutation_type: 'PENYESUAIAN_KEBERATAN',
              reference_type: 'Dispute',
              reference_id: dispute.id,
              amount_in: adjustment_amount,
              amount_out: 0,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              notes: `Penyesuaian keberatan ${existing.dispute_number}`,
              created_by_user_id: user.id,
            },
          })

          await tx.farmerWallet.update({
            where: { id: wallet.id },
            data: {
              available_balance: { increment: adjustment_amount },
            },
          })
        }
      }

      // Update sale status based on decision
      const saleStatus = status === 'DISETUJUI' ? 'DIKOREKSI' : status === 'DITOLAK' ? 'QC_SELESAI' : 'KEBERATAN'
      await tx.farmerSale.update({
        where: { id: existing.farmer_sale_id },
        data: { status: saleStatus },
      })

      return dispute
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Dispute',
      entityId: result.id,
      action: 'RESOLVE',
      beforeJson: existing,
      afterJson: result,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(result)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
