import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'audit_logs.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const actor_user_id = searchParams.get('actor_user_id')
    const entity_type = searchParams.get('entity_type')
    const action = searchParams.get('action')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const source_client = searchParams.get('source_client')

    const where: any = {}
    if (actor_user_id) where.actor_user_id = actor_user_id
    if (entity_type) where.entity_type = entity_type
    if (action) where.action = action
    if (source_client) where.source_client = source_client
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return successResponse(logs, {
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
