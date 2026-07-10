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
    if (!hasPermission(user, 'roles.view')) return forbiddenResponse()

    const roles = await prisma.role.findMany({
      include: {
        role_permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return successResponse(roles)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
