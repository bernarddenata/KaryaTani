import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createPayoutSchema } from '@/lib/validations/payout'
import { generatePayoutNumber } from '@/lib/utils/numbering'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_payouts.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const farmer_id = searchParams.get('farmer_id')
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (farmer_id) where.farmer_id = farmer_id
    if (status) where.status = status
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const [payouts, total] = await Promise.all([
      prisma.farmerPayout.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true } },
          cooperative: { select: { id: true, code: true, name: true } },
          paid_by: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.farmerPayout.count({ where }),
    ])

    return successResponse(payouts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_payouts.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createPayoutSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { farmer_id, cooperative_id, amount, payout_method, transfer_reference, proof_file_id } = parsed.data

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmer_id },
      select: { id: true, status: true, cooperative_id: true, verification_status: true, seller_type: true },
    })

    if (!farmer) return notFoundResponse('Data petani tidak ditemukan.')

    if (farmer.status !== 'ACTIVE') {
      return errorResponse('FARMER_INACTIVE', 'Petani tidak aktif. Pembayaran hanya dapat dilakukan ke petani yang aktif.')
    }

    if (farmer.cooperative_id !== cooperative_id) {
      return errorResponse('FARMER_NOT_MEMBER', 'Petani bukan anggota koperasi ini. Pembayaran hanya dapat dilakukan ke anggota koperasi yang terdaftar.')
    }

    const wallet = await prisma.farmerWallet.findFirst({
      where: { farmer_id, cooperative_id },
    })

    if (!wallet) return notFoundResponse('Dompet petani tidak ditemukan.')

    if (Number(wallet.available_balance) < amount) {
      return errorResponse('INSUFFICIENT_BALANCE', 'Saldo tidak mencukupi untuk pembayaran ini.')
    }

    const payout_number = await generatePayoutNumber()

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.farmerPayout.create({
        data: {
          cooperative_id,
          farmer_id,
          wallet_id: wallet.id,
          payout_number,
          amount,
          payout_method,
          transfer_reference: transfer_reference || null,
          proof_file_id: proof_file_id || null,
          status: 'SUDAH_DITRANSFER',
          paid_by_user_id: user.id,
          paid_at: new Date(),
        },
      })

      const balanceBefore = Number(wallet.available_balance)
      const balanceAfter = balanceBefore - amount

      await tx.farmerWalletMutation.create({
        data: {
          cooperative_id,
          farmer_id,
          wallet_id: wallet.id,
          mutation_type: 'PEMBAYARAN_TRANSFER',
          reference_type: 'FarmerPayout',
          reference_id: payout.id,
          amount_in: 0,
          amount_out: amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          notes: `Pembayaran ${payout_number}`,
          created_by_user_id: user.id,
        },
      })

      await tx.farmerWallet.update({
        where: { id: wallet.id },
        data: {
          available_balance: { decrement: amount },
          total_paid: { increment: amount },
        },
      })

      return payout
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerPayout',
      entityId: result.id,
      action: 'CREATE',
      afterJson: result,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
