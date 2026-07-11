import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import {
  generateFarmerToken,
  generateFarmerRefreshToken,
  verifyFarmerRefreshToken,
} from '@/lib/auth/farmer-jwt'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const refreshToken = body?.refresh_token
    if (!refreshToken || typeof refreshToken !== 'string') {
      return validationErrorResponse([
        { field: 'refresh_token', message: 'Refresh token wajib diisi.' },
      ])
    }

    const payload = verifyFarmerRefreshToken(refreshToken)
    if (!payload) {
      return errorResponse(
        'INVALID_REFRESH_TOKEN',
        'Refresh token tidak valid atau kedaluwarsa.',
        undefined,
        401
      )
    }

    const farmer = await prisma.farmer.findUnique({
      where: { id: payload.farmerId },
      select: { id: true, cooperative_id: true, phone: true, status: true, app_activated_at: true },
    })
    if (!farmer || farmer.status !== 'ACTIVE' || !farmer.app_activated_at) {
      return errorResponse(
        'INVALID_REFRESH_TOKEN',
        'Akun petani tidak aktif atau tidak ditemukan.',
        undefined,
        401
      )
    }

    return successResponse({
      access_token: generateFarmerToken({
        farmerId: farmer.id,
        cooperativeId: farmer.cooperative_id,
        phone: farmer.phone,
      }),
      refresh_token: generateFarmerRefreshToken(farmer.id),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
