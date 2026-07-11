import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const adjustmentInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
}

const updateStockAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Alasan wajib diisi.').optional(),
  notes: z.string().nullable().optional(),
  proof_file_id: z.string().uuid().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_adjustments.view')) return forbiddenResponse()

    const { id } = await params

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: adjustmentInclude,
    })

    if (!adjustment) return notFoundResponse('Penyesuaian tidak ditemukan.')
    if (!(await canAccessCooperative(user, adjustment.cooperative_id)))
      return notFoundResponse('Penyesuaian tidak ditemukan.')

    return successResponse(adjustment)
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
    if (!hasPermission(user, 'stock_adjustments.create')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.stockAdjustment.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Penyesuaian tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'DIKIRIM') {
      return errorResponse(
        'INVALID_STATUS',
        'Dokumen tidak dalam status yang dapat diubah.',
        undefined,
        409
      )
    }

    const body = await request.json()
    const parsed = updateStockAdjustmentSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const data: any = {}
    if (parsed.data.reason !== undefined) data.reason = parsed.data.reason
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
    if (parsed.data.proof_file_id !== undefined) data.proof_file_id = parsed.data.proof_file_id

    const updated = await prisma.stockAdjustment.update({
      where: { id },
      data,
      include: adjustmentInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockAdjustment',
      entityId: id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: updated,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
