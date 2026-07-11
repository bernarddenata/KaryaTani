import { NextRequest } from 'next/server'
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
  serverErrorResponse,
} from '@/lib/api/response'

const disposalInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
  created_by: { select: { id: true, name: true } },
} as const

export async function POST(
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

    const updated = await prisma.stockDisposal.update({
      where: { id },
      data: { status: 'DIBATALKAN' },
      include: disposalInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDisposal',
      entityId: id,
      action: 'CANCEL',
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
