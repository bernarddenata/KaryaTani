import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createQcTemplateItemSchema } from '@/lib/validations/qc-template'
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

    const template = await prisma.qcTemplate.findUnique({ where: { id } })
    if (!template) return notFoundResponse('Template QC tidak ditemukan.')
    if (!(await canAccessCooperative(user, template.cooperative_id)))
      return notFoundResponse('Template QC tidak ditemukan.')

    const items = await prisma.qcTemplateItem.findMany({
      where: { qc_template_id: id },
      orderBy: { sort_order: 'asc' },
    })

    return successResponse(items)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_templates.edit')) return forbiddenResponse()

    const { id } = await params

    const template = await prisma.qcTemplate.findUnique({ where: { id } })
    if (!template) return notFoundResponse('Template QC tidak ditemukan.')

    const body = await request.json()
    const parsed = createQcTemplateItemSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const item = await prisma.qcTemplateItem.create({
      data: {
        qc_template_id: id,
        item_name: parsed.data.item_name,
        item_code: parsed.data.item_code,
        input_type: parsed.data.input_type,
        is_required: parsed.data.is_required ?? true,
        requires_proof: parsed.data.requires_proof ?? false,
        options_json: parsed.data.options_json ?? null,
        min_value: parsed.data.min_value ?? null,
        max_value: parsed.data.max_value ?? null,
        help_text: parsed.data.help_text || null,
        sort_order: parsed.data.sort_order ?? 0,
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcTemplateItem',
      entityId: item.id,
      action: 'CREATE',
      afterJson: item,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(item, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
