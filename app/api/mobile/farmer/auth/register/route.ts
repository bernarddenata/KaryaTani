import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { generateFarmerToken } from '@/lib/auth/farmer-jwt'
import { mobileRegisterSchema } from '@/lib/validations/mobile-farmer'
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
    const parsed = mobileRegisterSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { identifier, pin } = parsed.data

    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [{ phone: identifier }, { farmer_number: identifier }],
      },
      include: {
        cooperative: { select: { id: true, code: true, name: true, status: true } },
      },
    })

    if (!farmer) {
      return errorResponse(
        'NOT_FOUND',
        'Nomor HP/anggota tidak terdaftar di koperasi.',
        undefined,
        404
      )
    }

    if (farmer.status !== 'ACTIVE' || farmer.cooperative.status !== 'ACTIVE') {
      return errorResponse('FORBIDDEN', 'Akun petani atau koperasi tidak aktif.', undefined, 403)
    }

    if (farmer.app_activated_at) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Akun sudah diaktifkan. Silakan login dengan PIN Anda.',
        undefined,
        409
      )
    }

    const pinHash = await hashPassword(pin)
    await prisma.farmer.update({
      where: { id: farmer.id },
      data: { pin_hash: pinHash, app_activated_at: new Date() },
    })

    const access_token = generateFarmerToken({
      farmerId: farmer.id,
      cooperativeId: farmer.cooperative_id,
      phone: farmer.phone,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'MOBILE_REGISTER',
      afterJson: { farmer_number: farmer.farmer_number },
      sourceClient: 'mobile_farmer',
      ...meta,
    })

    return successResponse(
      {
        access_token,
        refresh_token: null,
        user: {
          id: farmer.id,
          farmer_id: farmer.id,
          name: farmer.name,
          phone: farmer.phone,
          member_number: farmer.farmer_number,
          role: 'FARMER',
        },
      },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
