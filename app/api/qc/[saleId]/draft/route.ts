import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { draftQcResultSchema } from '@/lib/validations/qc-result'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  serverErrorResponse,
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
    const draft = sale.qc_results[0]
    if (!draft) {
      return errorResponse(
        'NO_DRAFT_QC',
        'Belum ada draft QC. Panggil POST /api/qc/{saleId}/start terlebih dahulu.',
        undefined,
        409
      )
    }

    const body = await request.json()
    const parsed = draftQcResultSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.parameter_values) {
        await tx.qcResultItem.deleteMany({ where: { qc_result_id: draft.id } })
        for (const p of parsed.data.parameter_values) {
          const templateItemId = p.qc_template_item_id || p.parameter_id
          if (!templateItemId) continue
          await tx.qcResultItem.create({
            data: {
              qc_result_id: draft.id,
              qc_template_item_id: templateItemId,
              value_text: p.value_text,
              value_number: p.value_number,
              value_json: p.value_json,
              notes: p.notes,
              proof_file_id: p.proof_file_id,
            },
          })
        }
      }

      if (parsed.data.grade_breakdowns) {
        await tx.qcGradeBreakdown.deleteMany({ where: { qc_result_id: draft.id } })
        for (const g of parsed.data.grade_breakdowns) {
          await tx.qcGradeBreakdown.create({
            data: {
              qc_result_id: draft.id,
              grade_name: g.grade_name || g.grade_code || 'Grade',
              grade_code: g.grade_code || g.grade_name || 'UNKNOWN',
              weight: g.weight,
              reason: g.reason,
            },
          })
        }
      }

      if (parsed.data.overall_notes !== undefined) {
        await tx.qcResult.update({
          where: { id: draft.id },
          data: { notes: parsed.data.overall_notes },
        })
      }

      return tx.qcResult.findUnique({
        where: { id: draft.id },
        include: { items: true, grade_breakdowns: true },
      })
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
