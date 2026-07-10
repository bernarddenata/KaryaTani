import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { getCooperativeAccess } from '@/lib/rbac/cooperative-scope'
import { createRepresentativeSchema } from '@/lib/validations/representative'
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
    if (!hasPermission(user, 'farmer_representatives.view'))
      return forbiddenResponse()

    const where: any = {}
    const access = await getCooperativeAccess(user)
    if (access.kind === 'SCOPED') {
      where.farmer = { ...(where.farmer || {}), cooperative_id: { in: access.ids } }
    }

    const representatives = await prisma.farmerRepresentative.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            farmer_number: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return successResponse(representatives)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_representatives.create'))
      return forbiddenResponse()

    const body = await request.json()
    const parsed = createRepresentativeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const representative = await prisma.farmerRepresentative.create({
      data: parsed.data,
      include: {
        farmer: {
          select: {
            id: true,
            farmer_number: true,
            name: true,
          },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerRepresentative',
      entityId: representative.id,
      action: 'CREATE',
      afterJson: representative,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(representative, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
