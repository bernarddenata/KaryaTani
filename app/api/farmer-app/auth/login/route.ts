import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { verifyPassword } from '@/lib/auth/password'
import { generateFarmerToken } from '@/lib/auth/farmer-jwt'
import { farmerLoginSchema } from '@/lib/validations/farmer-app'
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
    const parsed = farmerLoginSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { phone, pin } = parsed.data
    const meta = getRequestMeta(request)

    const farmer = await prisma.farmer.findFirst({
      where: { phone },
      include: {
        cooperative: { select: { id: true, code: true, name: true, status: true } },
      },
    })

    if (!farmer || !farmer.pin_hash) {
      await createAuditLog({
        entityType: 'Farmer',
        action: 'APP_LOGIN_FAILED',
        afterJson: { phone, reason: farmer ? 'not_activated' : 'not_found' },
        sourceClient: 'farmer_app',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Nomor HP atau PIN salah.',
        undefined,
        401
      )
    }

    const pinValid = await verifyPassword(pin, farmer.pin_hash)
    if (!pinValid) {
      await createAuditLog({
        entityType: 'Farmer',
        entityId: farmer.id,
        action: 'APP_LOGIN_FAILED',
        afterJson: { phone, reason: 'wrong_pin' },
        sourceClient: 'farmer_app',
        ...meta,
      })
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Nomor HP atau PIN salah.',
        undefined,
        401
      )
    }

    if (farmer.status !== 'ACTIVE') {
      return errorResponse(
        'FARMER_INACTIVE',
        'Akun petani Anda tidak aktif. Hubungi pengurus koperasi.',
        undefined,
        403
      )
    }

    const token = generateFarmerToken({
      farmerId: farmer.id,
      cooperativeId: farmer.cooperative_id,
      phone: farmer.phone,
    })

    await createAuditLog({
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'APP_LOGIN_SUCCESS',
      sourceClient: 'farmer_app',
      ...meta,
    })

    return successResponse({
      token,
      farmer: {
        id: farmer.id,
        farmer_number: farmer.farmer_number,
        name: farmer.name,
        phone: farmer.phone,
        photo_url: farmer.photo_url,
        seller_type: farmer.seller_type,
        verification_status: farmer.verification_status,
        cooperative: farmer.cooperative,
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
