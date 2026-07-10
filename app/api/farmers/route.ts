import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createFarmerSchema } from '@/lib/validations/farmer'
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
    if (!hasPermission(user, 'farmers.view')) return forbiddenResponse()

    const farmers = await prisma.farmer.findMany({
      include: {
        cooperative: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return successResponse(farmers)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmers.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createFarmerSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const farmer = await prisma.farmer.create({
      data: parsed.data,
      include: {
        cooperative: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'CREATE',
      afterJson: farmer,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(farmer, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
