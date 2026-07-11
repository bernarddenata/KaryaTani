import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { submitQcResultSchema } from '@/lib/validations/qc-result'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  loadActivePriceListItems,
  resolveBreakdownAgainstPriceList,
} from '@/lib/qc/pricing'
import { moveQcResultToStock } from '@/lib/inventory/service'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_results.create')) return forbiddenResponse()

    const { saleId } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id: saleId },
      include: {
        qc_results: {
          where: { status: 'DRAFT' },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Penjualan tidak ditemukan.')

    const draftQcResult = sale.qc_results[0]
    if (!draftQcResult) {
      return errorResponse('NO_DRAFT_QC', 'Tidak ada draft QC untuk penjualan ini.', undefined, 409)
    }

    const body = await request.json()
    const parsed = submitQcResultSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const totalBreakdownWeight = parsed.data.grade_breakdowns.reduce(
      (sum, b) => sum + b.weight,
      0
    )
    const receivedWeight = sale.received_weight ? Number(sale.received_weight) : 0
    if (receivedWeight > 0 && totalBreakdownWeight > receivedWeight) {
      return validationErrorResponse([
        {
          field: 'grade_breakdowns',
          message: `Total berat grade breakdown (${totalBreakdownWeight}) melebihi berat diterima (${receivedWeight}).`,
        },
      ])
    }

    const { items: priceItems, priceListId } = await loadActivePriceListItems(
      sale.cooperative_id,
      sale.commodity_id,
      sale.price_list_id
    )

    const parameterValues = parsed.data.parameter_values || parsed.data.items || []

    const result = await prisma.$transaction(async (tx) => {
      await tx.qcResultItem.deleteMany({ where: { qc_result_id: draftQcResult.id } })
      for (const pv of parameterValues) {
        const templateItemId = ('qc_template_item_id' in pv && pv.qc_template_item_id)
          || ('parameter_id' in pv ? pv.parameter_id : undefined)
        if (!templateItemId) continue
        await tx.qcResultItem.create({
          data: {
            qc_result_id: draftQcResult.id,
            qc_template_item_id: templateItemId,
            value_text: pv.value_text,
            value_number: pv.value_number,
            value_json: pv.value_json,
            notes: pv.notes,
            proof_file_id: pv.proof_file_id,
          },
        })
      }

      await tx.qcGradeBreakdown.deleteMany({ where: { qc_result_id: draftQcResult.id } })
      const createdBreakdowns: Array<{
        id: string
        grade_name: string
        grade_code: string
        weight: number
        price_per_unit: number
        estimated_amount: number
        is_reject: boolean
      }> = []

      for (const gb of parsed.data.grade_breakdowns) {
        const resolved = resolveBreakdownAgainstPriceList(
          { grade_id: gb.grade_id, grade_code: gb.grade_code, grade_name: gb.grade_name, weight: gb.weight },
          priceItems
        )
        const created = await tx.qcGradeBreakdown.create({
          data: {
            qc_result_id: draftQcResult.id,
            grade_name: resolved.grade_name,
            grade_code: resolved.grade_code,
            weight: resolved.weight,
            price_per_unit: resolved.price_per_unit,
            estimated_amount: resolved.estimated_amount,
            reason: gb.reason,
          },
        })
        createdBreakdowns.push({
          id: created.id,
          grade_name: resolved.grade_name,
          grade_code: resolved.grade_code,
          weight: resolved.weight,
          price_per_unit: resolved.price_per_unit,
          estimated_amount: resolved.estimated_amount,
          is_reject: resolved.is_reject,
        })
      }

      let finalAcceptedWeight = 0
      let totalRejectedWeight = 0
      let totalWeightChecked = 0
      let subtotalAmount = 0
      for (const b of createdBreakdowns) {
        totalWeightChecked += b.weight
        if (b.is_reject) totalRejectedWeight += b.weight
        else finalAcceptedWeight += b.weight
        subtotalAmount += b.estimated_amount
      }
      const deduction = parsed.data.deduction_amount || 0
      const totalAmount = Math.max(0, subtotalAmount - deduction)

      const updatedQcResult = await tx.qcResult.update({
        where: { id: draftQcResult.id },
        data: {
          final_grade_code: parsed.data.final_grade_code,
          recommended_grade_code: parsed.data.recommended_grade_code,
          total_weight_checked: parsed.data.total_weight_checked ?? totalWeightChecked,
          final_accepted_weight: parsed.data.final_accepted_weight ?? finalAcceptedWeight,
          total_rejected_weight: parsed.data.total_rejected_weight ?? totalRejectedWeight,
          notes: parsed.data.overall_notes ?? parsed.data.notes,
          status: 'DIKIRIM',
          submitted_at: new Date(),
        },
        include: { items: true, grade_breakdowns: true },
      })

      const updatedSale = await tx.farmerSale.update({
        where: { id: saleId },
        data: {
          total_amount: priceItems.length > 0 ? totalAmount : undefined,
          calculated_at: priceItems.length > 0 ? new Date() : undefined,
          status: priceItems.length > 0 ? 'MENUNGGU_PEMBAYARAN' : 'QC_SELESAI',
          price_list_id: priceListId ?? sale.price_list_id,
        },
      })

      if (parsed.data.qc_photo_file_ids && parsed.data.qc_photo_file_ids.length > 0) {
        for (const fileId of parsed.data.qc_photo_file_ids) {
          await tx.farmerSalePhoto.create({
            data: {
              farmer_sale_id: saleId,
              file_id: fileId,
              photo_type: 'FOTO_QC',
              uploaded_by_user_id: user.id,
            },
          })
        }
      }

      let walletMutation = null
      if (priceItems.length > 0 && totalAmount > 0) {
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
        const existing = await tx.farmerWalletMutation.findFirst({
          where: {
            reference_type: 'FarmerSale',
            reference_id: saleId,
            mutation_type: 'HASIL_PENJUALAN',
          },
        })
        if (!existing) {
          const balanceBefore = Number(wallet.available_balance)
          const balanceAfter = balanceBefore + totalAmount
          walletMutation = await tx.farmerWalletMutation.create({
            data: {
              cooperative_id: sale.cooperative_id,
              farmer_id: sale.farmer_id,
              wallet_id: wallet.id,
              mutation_type: 'HASIL_PENJUALAN',
              reference_type: 'FarmerSale',
              reference_id: saleId,
              amount_in: totalAmount,
              amount_out: 0,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              notes: `Hasil QC ${sale.sale_number}`,
              created_by_user_id: user.id,
            },
          })
          await tx.farmerWallet.update({
            where: { id: wallet.id },
            data: { available_balance: { increment: totalAmount } },
          })
        }
      }

      await tx.notification.create({
        data: {
          farmer_id: sale.farmer_id,
          title: 'Hasil QC tersedia',
          message: `Hasil QC untuk batch ${sale.batch_number} telah selesai. Estimasi pembayaran: Rp${totalAmount.toLocaleString('id-ID')}.`,
          notification_type: 'QC_COMPLETED',
          related_entity_type: 'FarmerSale',
          related_entity_id: saleId,
        },
      })

      return {
        qc_result: updatedQcResult,
        sale: updatedSale,
        breakdown: createdBreakdowns,
        subtotal_amount: subtotalAmount,
        deduction_amount: deduction,
        total_estimated_amount: totalAmount,
        wallet_mutation: walletMutation,
      }
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcResult',
      entityId: draftQcResult.id,
      action: 'SUBMIT',
      afterJson: {
        qc_result_id: result.qc_result.id,
        sale_id: saleId,
        total_estimated_amount: result.total_estimated_amount,
      },
      sourceClient: 'mobile_qc',
      ...meta,
    })

    // Flow persediaan: pindahkan stok Transit ke Stok Baik / Stok Rusak
    // sesuai grade breakdown (idempoten). Non-fatal untuk alur QC.
    try {
      const movements = await moveQcResultToStock(draftQcResult.id, user.id)
      if (movements.length > 0) {
        await createAuditLog({
          actorUserId: user.id,
          entityType: 'StockMovement',
          entityId: draftQcResult.id,
          action: 'QC_STOCK_MOVED',
          afterJson: {
            qc_result_id: draftQcResult.id,
            sale_id: saleId,
            movement_count: movements.length,
          },
          sourceClient: 'mobile_qc',
          ...meta,
        })
      }
    } catch (invErr) {
      console.error('moveQcResultToStock failed:', invErr)
    }

    return successResponse({
      qc_result: {
        id: result.qc_result.id,
        status: result.qc_result.status,
        submitted_at: result.qc_result.submitted_at,
        final_grade_code: result.qc_result.final_grade_code,
        final_accepted_weight: result.qc_result.final_accepted_weight,
        total_rejected_weight: result.qc_result.total_rejected_weight,
        items: result.qc_result.items,
        grade_breakdowns: result.qc_result.grade_breakdowns,
      },
      submission: {
        id: result.sale.id,
        sale_number: result.sale.sale_number,
        batch_number: result.sale.batch_number,
        status: result.sale.status,
      },
      payment_estimation: {
        subtotal_amount: result.subtotal_amount,
        deduction_amount: result.deduction_amount,
        total_estimated_amount: result.total_estimated_amount,
        payment_status: result.sale.status === 'MENUNGGU_PEMBAYARAN' ? 'PAYMENT_PENDING' : 'ESTIMATED',
        payment_status_label:
          result.sale.status === 'MENUNGGU_PEMBAYARAN'
            ? 'Menunggu Pembayaran'
            : 'Estimasi',
        breakdown: result.breakdown,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
