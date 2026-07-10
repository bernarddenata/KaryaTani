import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt'
import { refreshTokenSchema } from '@/lib/validations/auth'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = refreshTokenSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const payload = verifyRefreshToken(parsed.data.refresh_token)
    if (!payload) {
      return errorResponse(
        'INVALID_REFRESH_TOKEN',
        'Refresh token tidak valid atau kedaluwarsa.',
        undefined,
        401
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, status: true },
    })
    if (!user || user.status !== 'ACTIVE') {
      return errorResponse(
        'INVALID_REFRESH_TOKEN',
        'Pengguna tidak aktif atau tidak ditemukan.',
        undefined,
        401
      )
    }

    const access_token = generateToken({ userId: user.id, email: user.email })
    const refresh_token = generateRefreshToken(user.id)

    return successResponse({ access_token, refresh_token, token: access_token })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
