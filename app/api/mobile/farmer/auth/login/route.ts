import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { verifyPassword } from '@/lib/auth/password'
import { generateFarmerToken, generateFarmerRefreshToken } from '@/lib/auth/farmer-jwt'
import { mobileLoginSchema } from '@/lib/validations/mobile-farmer'
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
    const parsed = mobileLoginSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { identifier, pin } = parsed.data
    const meta = getRequestMeta(request)

    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [{ phone: identifier }, { farmer_number: identifier }],
      },
      include: {
        cooperative: { select: { id: true, code: true, name: true, status: true } },
      },
    })

    if (!farmer || !farmer.pin_hash) {
      await createAuditLog({
        entityType: 'Farmer',
        action: 'MOBILE_LOGIN_FAILED',
        afterJson: { identifier, reason: farmer ? 'not_activated' : 'not_found' },
        sourceClient: 'mobile_farmer',
        ...meta,
      })
      return errorResponse('UNAUTHORIZED', 'Nomor HP/anggota atau PIN salah.', undefined, 401)
    }

    const pinValid = await verifyPassword(pin, farmer.pin_hash)
    if (!pinValid) {
      await createAuditLog({
        entityType: 'Farmer',
        entityId: farmer.id,
        action: 'MOBILE_LOGIN_FAILED',
        afterJson: { identifier, reason: 'wrong_pin' },
        sourceClient: 'mobile_farmer',
        ...meta,
      })
      return errorResponse('UNAUTHORIZED', 'Nomor HP/anggota atau PIN salah.', undefined, 401)
    }

    if (farmer.status !== 'ACTIVE') {
      return errorResponse(
        'FORBIDDEN',
        'Akun petani tidak aktif. Hubungi pengurus koperasi.',
        undefined,
        403
      )
    }

    if (farmer.cooperative.status !== 'ACTIVE') {
      return errorResponse(
        'FORBIDDEN',
        'Koperasi Anda tidak aktif. Hubungi pengurus koperasi.',
        undefined,
        403
      )
    }

    const access_token = generateFarmerToken({
      farmerId: farmer.id,
      cooperativeId: farmer.cooperative_id,
      phone: farmer.phone,
    })

    await createAuditLog({
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'MOBILE_LOGIN_SUCCESS',
      sourceClient: 'mobile_farmer',
      ...meta,
    })

    return successResponse({
      access_token,
      refresh_token: generateFarmerRefreshToken(farmer.id),
      user: {
        id: farmer.id,
        farmer_id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        member_number: farmer.farmer_number,
        role: 'FARMER',
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
