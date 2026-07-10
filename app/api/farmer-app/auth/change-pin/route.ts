import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { farmerChangePinSchema } from '@/lib/validations/farmer-app'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const body = await request.json()
    const parsed = farmerChangePinSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const { current_pin, new_pin } = parsed.data

    const farmerRecord = await prisma.farmer.findUnique({
      where: { id: farmer.id },
      select: { pin_hash: true },
    })

    if (!farmerRecord?.pin_hash) {
      return errorResponse('PIN_NOT_SET', 'PIN belum diatur.', undefined, 400)
    }

    const valid = await verifyPassword(current_pin, farmerRecord.pin_hash)
    if (!valid) {
      return errorResponse('WRONG_PIN', 'PIN lama salah.', undefined, 401)
    }

    const newHash = await hashPassword(new_pin)
    await prisma.farmer.update({
      where: { id: farmer.id },
      data: { pin_hash: newHash },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'APP_CHANGE_PIN',
      sourceClient: 'farmer_app',
      ...meta,
    })

    return successResponse({ message: 'PIN berhasil diubah.' })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
