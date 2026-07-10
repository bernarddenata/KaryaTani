import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getPermissions } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const permissions = getPermissions(user)

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles: user.user_roles.map((ur) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
      })),
      permissions,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
