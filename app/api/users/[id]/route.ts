import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { hashPassword } from '@/lib/auth/password'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { updateUserSchema } from '@/lib/validations/user'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'users.view')) return forbiddenResponse()

    const { id } = await params

    const targetUser = await prisma.user.findUnique({
      where: { id },
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
            role: {
              include: {
                role_permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })

    if (!targetUser) return notFoundResponse('Pengguna tidak ditemukan.')

    return successResponse(targetUser)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'users.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Pengguna tidak ditemukan.')

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { name, email, phone, status, role_ids, password } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (status !== undefined) updateData.status = status
    if (password !== undefined) updateData.password_hash = await hashPassword(password)

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: updateData,
      })

      if (role_ids !== undefined) {
        await tx.userRole.deleteMany({ where: { user_id: id } })
        await tx.userRole.createMany({
          data: role_ids.map((roleId) => ({
            user_id: id,
            role_id: roleId,
          })),
        })
      }

      return tx.user.findUnique({
        where: { id },
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
      entityId: id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: updatedUser,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updatedUser)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
