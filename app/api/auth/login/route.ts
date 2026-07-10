import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { verifyPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/validations/auth'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { email, password } = parsed.data
    const meta = getRequestMeta(request)

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
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

    if (!user) {
      await createAuditLog({
        entityType: 'User',
        action: 'LOGIN_FAILED',
        afterJson: { email, reason: 'user_not_found' },
        sourceClient: 'web',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Email atau kata sandi salah.',
        undefined,
        401
      )
    }

    const passwordValid = await verifyPassword(password, user.password_hash)
    if (!passwordValid) {
      await createAuditLog({
        actorUserId: user.id,
        entityType: 'User',
        entityId: user.id,
        action: 'LOGIN_FAILED',
        afterJson: { email, reason: 'wrong_password' },
        sourceClient: 'web',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Email atau kata sandi salah.',
        undefined,
        401
      )
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(
        'ACCOUNT_INACTIVE',
        'Akun Anda tidak aktif. Hubungi administrator.',
        undefined,
        403
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    })

    const token = generateToken({ userId: user.id, email: user.email })

    await createAuditLog({
      actorUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      action: 'LOGIN_SUCCESS',
      sourceClient: 'web',
      ...meta,
    })

    const { password_hash, ...userWithoutPassword } = user

    const response = successResponse({
      token,
      user: userWithoutPassword,
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
