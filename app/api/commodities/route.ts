import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createCommoditySchema } from '@/lib/validations/commodity'
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
    if (!hasPermission(user, 'commodities.view')) return forbiddenResponse()

    const commodities = await prisma.commodity.findMany({
      include: {
        variants: true,
      },
      orderBy: { name: 'asc' },
    })

    return successResponse(commodities)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'commodities.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createCommoditySchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const commodity = await prisma.commodity.create({
      data: parsed.data,
      include: {
        variants: true,
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Commodity',
      entityId: commodity.id,
      action: 'CREATE',
      afterJson: commodity,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(commodity, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
