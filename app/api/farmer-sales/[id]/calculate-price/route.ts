import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.edit')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id },
      include: {
        qc_results: {
          include: { grade_breakdowns: true },
        },
      },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    const qcResult = sale.qc_results.find(
      (r) => r.status === 'DIKIRIM' || r.status === 'DISETUJUI'
    )
    if (!qcResult) {
      return errorResponse(
        'NO_QC_RESULT',
        'Belum ada hasil QC untuk penjualan ini.'
      )
    }

    if (!sale.price_list_id) {
      return errorResponse(
        'NO_PRICE_LIST',
        'Belum ada daftar harga untuk penjualan ini.'
      )
    }

    const priceList = await prisma.priceList.findUnique({
      where: { id: sale.price_list_id },
      include: { items: true },
    })

    if (!priceList) {
      return errorResponse(
        'NO_PRICE_LIST',
        'Daftar harga tidak ditemukan.'
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const breakdown: Array<{
        id: string
        grade_name: string
        grade_code: string
        weight: number
        price_per_unit: number
        estimated_amount: number
      }> = []

      for (const gb of qcResult.grade_breakdowns) {
        const matchingItem = priceList.items.find(
          (item) => item.grade_code === gb.grade_code
        )

        const pricePerUnit = matchingItem ? Number(matchingItem.price_per_unit) : 0
        const weight = Number(gb.weight)
        const estimatedAmount = weight * pricePerUnit

        await tx.qcGradeBreakdown.update({
          where: { id: gb.id },
          data: {
            price_per_unit: pricePerUnit,
            estimated_amount: estimatedAmount,
          },
        })

        breakdown.push({
          id: gb.id,
          grade_name: gb.grade_name,
          grade_code: gb.grade_code,
          weight,
          price_per_unit: pricePerUnit,
          estimated_amount: estimatedAmount,
        })
      }

      const totalAmount = breakdown.reduce((sum, b) => sum + b.estimated_amount, 0)

      const updatedSale = await tx.farmerSale.update({
        where: { id: sale.id },
        data: {
          total_amount: totalAmount,
          calculated_at: new Date(),
          status: 'MENUNGGU_PEMBAYARAN',
        },
      })

      let wallet = await tx.farmerWallet.findFirst({
        where: {
          cooperative_id: sale.cooperative_id,
          farmer_id: sale.farmer_id,
        },
      })

      if (!wallet) {
        wallet = await tx.farmerWallet.create({
          data: {
            cooperative_id: sale.cooperative_id,
            farmer_id: sale.farmer_id,
            available_balance: 0,
            held_balance: 0,
            total_paid: 0,
          },
        })
      }

      const existingMutation = await tx.farmerWalletMutation.findFirst({
        where: {
          reference_type: 'FarmerSale',
          reference_id: sale.id,
          mutation_type: 'HASIL_PENJUALAN',
        },
      })

      if (!existingMutation) {
        const balanceBefore = Number(wallet.available_balance)
        const balanceAfter = balanceBefore + totalAmount

        await tx.farmerWalletMutation.create({
          data: {
            cooperative_id: sale.cooperative_id,
            farmer_id: sale.farmer_id,
            wallet_id: wallet.id,
            mutation_type: 'HASIL_PENJUALAN',
            reference_type: 'FarmerSale',
            reference_id: sale.id,
            amount_in: totalAmount,
            amount_out: 0,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            created_by_user_id: user.id,
          },
        })

        await tx.farmerWallet.update({
          where: { id: wallet.id },
          data: {
            available_balance: { increment: totalAmount },
          },
        })
      }

      return { sale: updatedSale, totalAmount, breakdown }
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerSale',
      entityId: id,
      action: 'CALCULATE_PRICE',
      afterJson: {
        total_amount: result.totalAmount,
        breakdown: result.breakdown,
      },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse({
      sale_id: sale.id,
      total_amount: result.totalAmount,
      breakdown: result.breakdown,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
