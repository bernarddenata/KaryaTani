import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { generateFarmerToken } from '@/lib/auth/farmer-jwt'
import { farmerRegisterSchema } from '@/lib/validations/farmer-app'
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
    const parsed = farmerRegisterSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { phone, pin } = parsed.data

    const farmer = await prisma.farmer.findFirst({
      where: { phone },
      include: {
        cooperative: { select: { id: true, code: true, name: true, status: true } },
      },
    })

    if (!farmer) {
      return errorResponse(
        'FARMER_NOT_FOUND',
        'Nomor HP tidak terdaftar di koperasi. Hubungi pengurus koperasi untuk mendaftarkan data Anda.',
        undefined,
        404
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

    if (farmer.cooperative.status !== 'ACTIVE') {
      return errorResponse(
        'COOPERATIVE_INACTIVE',
        'Koperasi Anda tidak aktif. Hubungi pengurus koperasi.',
        undefined,
        403
      )
    }

    if (farmer.app_activated_at) {
      return errorResponse(
        'ALREADY_ACTIVATED',
        'Akun sudah diaktifkan. Silakan login dengan PIN Anda.',
        undefined,
        409
      )
    }

    const pinHash = await hashPassword(pin)

    await prisma.farmer.update({
      where: { id: farmer.id },
      data: {
        pin_hash: pinHash,
        app_activated_at: new Date(),
      },
    })

    const token = generateFarmerToken({
      farmerId: farmer.id,
      cooperativeId: farmer.cooperative_id,
      phone: farmer.phone,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'APP_REGISTER',
      afterJson: { phone: farmer.phone, farmer_number: farmer.farmer_number },
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
        cooperative: farmer.cooperative,
      },
    }, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
