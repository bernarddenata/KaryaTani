import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { submitQcResultSchema } from '@/lib/validations/qc-result'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
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

    const draftQcResult = sale.qc_results[0]
    if (!draftQcResult) {
      return errorResponse('NO_DRAFT_QC', 'Tidak ada draft QC untuk penjualan ini.')
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
    if (totalBreakdownWeight > receivedWeight) {
      return validationErrorResponse([
        {
          field: 'grade_breakdowns',
          message: `Total berat grade breakdown (${totalBreakdownWeight}) melebihi berat diterima (${receivedWeight}).`,
        },
      ])
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of parsed.data.items) {
        await tx.qcResultItem.create({
          data: {
            qc_result_id: draftQcResult.id,
            qc_template_item_id: item.qc_template_item_id,
            value_text: item.value_text,
            value_number: item.value_number,
            value_json: item.value_json,
            notes: item.notes,
            proof_file_id: item.proof_file_id,
          },
        })
      }

      for (const breakdown of parsed.data.grade_breakdowns) {
        await tx.qcGradeBreakdown.create({
          data: {
            qc_result_id: draftQcResult.id,
            grade_name: breakdown.grade_name,
            grade_code: breakdown.grade_code,
            weight: breakdown.weight,
            reason: breakdown.reason,
          },
        })
      }

      let finalAcceptedWeight = 0
      let totalRejectedWeight = 0
      let totalWeightChecked = 0
      for (const breakdown of parsed.data.grade_breakdowns) {
        totalWeightChecked += breakdown.weight
        const isReject =
          breakdown.grade_code === 'REJECT' ||
          breakdown.grade_name.toLowerCase().includes('reject')
        if (isReject) {
          totalRejectedWeight += breakdown.weight
        } else {
          finalAcceptedWeight += breakdown.weight
        }
      }

      const updatedQcResult = await tx.qcResult.update({
        where: { id: draftQcResult.id },
        data: {
          final_grade_code: parsed.data.final_grade_code,
          recommended_grade_code: parsed.data.recommended_grade_code,
          total_weight_checked: totalWeightChecked,
          final_accepted_weight: finalAcceptedWeight,
          total_rejected_weight: totalRejectedWeight,
          notes: parsed.data.notes,
          status: 'DIKIRIM',
          submitted_at: new Date(),
        },
        include: {
          items: true,
          grade_breakdowns: true,
        },
      })

      await tx.farmerSale.update({
        where: { id: saleId },
        data: { status: 'QC_SELESAI' },
      })

      return updatedQcResult
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcResult',
      entityId: draftQcResult.id,
      action: 'UPDATE',
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
