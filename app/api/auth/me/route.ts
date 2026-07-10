import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { getPermissions } from '@/lib/rbac/permissions'
import { getCooperativeAccess } from '@/lib/rbac/cooperative-scope'
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
    const access = await getCooperativeAccess(user)

    const isGlobal = access.kind === 'ALL'
    const mappingRows = isGlobal
      ? []
      : await prisma.userCooperative.findMany({
          where: { user_id: user.id, status: 'AKTIF' },
          include: {
            cooperative: {
              select: { id: true, code: true, name: true, status: true },
            },
          },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        })

    let accessibleCooperatives
    if (isGlobal) {
      const all = await prisma.cooperative.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, code: true, name: true, status: true },
        orderBy: { created_at: 'asc' },
      })
      accessibleCooperatives = all.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        status: c.status,
        assignment_type: 'SYSTEM_ADMIN',
        is_primary: false,
      }))
    } else {
      accessibleCooperatives = mappingRows.map((m) => ({
        id: m.cooperative.id,
        code: m.cooperative.code,
        name: m.cooperative.name,
        status: m.cooperative.status,
        assignment_type: m.assignment_type,
        is_primary: m.is_primary,
      }))
    }

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
      accessible_cooperatives: accessibleCooperatives,
      is_global_access: isGlobal,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
