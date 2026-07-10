import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { updateQcTemplateSchema } from '@/lib/validations/qc-template'
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
    if (!hasPermission(user, 'qc_templates.view')) return forbiddenResponse()

    const { id } = await params

    const template = await prisma.qcTemplate.findUnique({
      where: { id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
        items: {
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    if (!template) return notFoundResponse('Template QC tidak ditemukan.')

    return successResponse(template)
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
    if (!hasPermission(user, 'qc_templates.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.qcTemplate.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Template QC tidak ditemukan.')

    const body = await request.json()
    const parsed = updateQcTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updateData: any = { ...parsed.data }
    if (parsed.data.valid_from) updateData.valid_from = new Date(parsed.data.valid_from)
    if (parsed.data.valid_until) updateData.valid_until = new Date(parsed.data.valid_until)

    const updated = await prisma.qcTemplate.update({
      where: { id },
      data: updateData,
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
        items: {
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcTemplate',
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
