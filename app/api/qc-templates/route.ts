import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import { createQcTemplateSchema } from '@/lib/validations/qc-template'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_templates.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const cooperativeId = searchParams.get('cooperative_id')
    const commodityId = searchParams.get('commodity_id')
    const status = searchParams.get('status')

    const where: any = {}
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (commodityId) where.commodity_id = commodityId
    if (status) where.status = status

    const scopedWhere = await applyCooperativeScope(where, user)

    const [templates, total] = await Promise.all([
      prisma.qcTemplate.findMany({
        where: scopedWhere,
        include: {
          cooperative: { select: { id: true, code: true, name: true } },
          commodity: { select: { id: true, code: true, name: true } },
          commodity_variant: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.qcTemplate.count({ where: scopedWhere }),
    ])

    return successResponse(templates, {
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
    if (!hasPermission(user, 'qc_templates.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createQcTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const template = await prisma.qcTemplate.create({
      data: {
        cooperative_id: parsed.data.cooperative_id,
        commodity_id: parsed.data.commodity_id,
        commodity_variant_id: parsed.data.commodity_variant_id || null,
        name: parsed.data.name,
        version: parsed.data.version ?? 1,
        valid_from: new Date(parsed.data.valid_from),
        valid_until: parsed.data.valid_until ? new Date(parsed.data.valid_until) : null,
        status: parsed.data.status || 'DRAFT',
      },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true } },
        commodity_variant: { select: { id: true, code: true, name: true } },
        _count: { select: { items: true } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcTemplate',
      entityId: template.id,
      action: 'CREATE',
      afterJson: template,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(template, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
