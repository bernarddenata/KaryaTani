import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { hashPassword } from '@/lib/auth/password'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { createUserSchema } from '@/lib/validations/user'
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
    if (!hasPermission(user, 'users.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          created_at: true,
          updated_at: true,
          last_login_at: true,
          user_roles: {
            include: {
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count(),
    ])

    return successResponse(users, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'users.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { name, email, phone, password, role_ids } = parsed.data

    const hashedPassword = await hashPassword(password)

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password_hash: hashedPassword,
        },
      })

      await tx.userRole.createMany({
        data: role_ids.map((roleId) => ({
          user_id: created.id,
          role_id: roleId,
        })),
      })

      return tx.user.findUnique({
        where: { id: created.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          created_at: true,
          updated_at: true,
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      })
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'User',
      entityId: newUser!.id,
      action: 'CREATE',
      afterJson: { name, email, role_ids },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(newUser, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
