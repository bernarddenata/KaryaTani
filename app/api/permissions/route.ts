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

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    })

    const grouped: Record<string, typeof permissions> = {}
    for (const perm of permissions) {
      if (!grouped[perm.module]) grouped[perm.module] = []
      grouped[perm.module].push(perm)
    }

    return successResponse(grouped)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
