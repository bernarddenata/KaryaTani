import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma/client'
import { UserWithRoles } from '@/lib/rbac/permissions'

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieToken = request.cookies.get('token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

export async function getCurrentUser(request: NextRequest): Promise<UserWithRoles | null> {
  const token = extractToken(request)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      user_roles: {
        include: {
          role: {
            include: {
              role_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user || user.status !== 'ACTIVE') return null

  return user as UserWithRoles
}

export async function requireAuth(request: NextRequest): Promise<UserWithRoles> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
