import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { verifyPassword } from '@/lib/auth/password'
import { generateToken, generateRefreshToken } from '@/lib/auth/jwt'
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

    const { email, identifier, password } = parsed.data
    const login = (identifier || email || '').trim()
    const meta = getRequestMeta(request)

    const isEmail = login.includes('@')

    const userInclude = {
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
    }

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: login }, include: userInclude })
      : await prisma.user.findFirst({ where: { phone: login }, include: userInclude })

    if (!user) {
      await createAuditLog({
        entityType: 'User',
        action: 'LOGIN_FAILED',
        afterJson: { identifier: login, reason: 'user_not_found' },
        sourceClient: 'web',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Email/nomor HP atau kata sandi salah.',
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
        afterJson: { identifier: login, reason: 'wrong_password' },
        sourceClient: 'web',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Email/nomor HP atau kata sandi salah.',
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

    const access_token = generateToken({ userId: user.id, email: user.email })
    const refresh_token = generateRefreshToken(user.id)

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
      access_token,
      refresh_token,
      token: access_token,
      user: userWithoutPassword,
    })

    response.cookies.set('token', access_token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
