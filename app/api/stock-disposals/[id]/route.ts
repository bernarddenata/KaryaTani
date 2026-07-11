import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createStockDisposalSchema } from '@/lib/validations/inventory'
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

const disposalInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
  created_by: { select: { id: true, name: true } },
  proof_file: true,
} as const

const updateStockDisposalSchema = createStockDisposalSchema
  .omit({
    warehouse_id: true,
    location_id: true,
    commodity_id: true,
    commodity_variant_id: true,
  })
  .partial()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_disposals.view')) return forbiddenResponse()

    const { id } = await params

    const disposal = await prisma.stockDisposal.findUnique({
      where: { id },
      include: disposalInclude,
    })

    if (!disposal) return notFoundResponse('Pemusnahan tidak ditemukan.')
    if (!(await canAccessCooperative(user, disposal.cooperative_id)))
      return notFoundResponse('Pemusnahan tidak ditemukan.')

    return successResponse(disposal)
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
    if (!hasPermission(user, 'stock_disposals.create')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.stockDisposal.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Pemusnahan tidak ditemukan.')
    if (!(await canAccessCooperative(user, existing.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'DIKIRIM') {
      return errorResponse(
        'INVALID_STATUS',
        'Dokumen tidak dalam status yang dapat diproses.',
        undefined,
        409
      )
    }

    const body = await request.json()
    const parsed = updateStockDisposalSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { disposal_date, grade_code, grade_name, ...rest } = parsed.data

    const data: any = { ...rest }
    if (disposal_date !== undefined) data.disposal_date = new Date(disposal_date)
    if (grade_code !== undefined) {
      data.grade_code = grade_code || null
      data.grade_name = grade_name || grade_code || null
    } else if (grade_name !== undefined) {
      data.grade_name = grade_name || null
    }

    const updated = await prisma.stockDisposal.update({
      where: { id },
      data,
      include: disposalInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDisposal',
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
