import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'cooperatives.view')) return forbiddenResponse()

    const { id } = await params

    if (!(await canAccessCooperative(user, id))) return forbiddenResponse()

    const coop = await prisma.cooperative.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    })
    if (!coop) return notFoundResponse('Koperasi tidak ditemukan.')

    const assignments = await prisma.userCooperative.findMany({
      where: { cooperative_id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            user_roles: {
              include: {
                role: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    })

    return successResponse(
      assignments.map((a) => ({
        assignment_id: a.id,
        assignment_type: a.assignment_type,
        is_primary: a.is_primary,
        status: a.status,
        created_at: a.created_at,
        user: {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
          phone: a.user.phone,
          status: a.user.status,
          roles: a.user.user_roles.map((ur) => ur.role),
        },
      }))
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
