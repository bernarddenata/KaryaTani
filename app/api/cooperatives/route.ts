import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createCooperativeSchema } from '@/lib/validations/cooperative'
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
    if (!hasPermission(user, 'cooperatives.view')) return forbiddenResponse()

    const cooperatives = await prisma.cooperative.findMany({
      orderBy: { name: 'asc' },
    })

    return successResponse(cooperatives)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'cooperatives.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createCooperativeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const cooperative = await prisma.cooperative.create({
      data: parsed.data,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Cooperative',
      entityId: cooperative.id,
      action: 'CREATE',
      afterJson: cooperative,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(cooperative, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
