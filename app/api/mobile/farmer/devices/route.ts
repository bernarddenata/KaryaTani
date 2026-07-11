import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/**
 * Registrasi token perangkat (FCM/APNS) untuk push notification.
 * Idempoten per (farmer, device_token).
 */
export async function POST(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const body = await request.json().catch(() => ({}))
    const deviceToken = body?.device_token
    const platform = body?.platform === 'ios' ? 'ios' : 'android'
    if (!deviceToken || typeof deviceToken !== 'string' || deviceToken.length < 10) {
      return validationErrorResponse([
        { field: 'device_token', message: 'Token perangkat wajib diisi.' },
      ])
    }

    const device = await prisma.farmerDevice.upsert({
      where: {
        farmer_id_device_token: {
          farmer_id: farmer.id,
          device_token: deviceToken,
        },
      },
      update: { platform },
      create: { farmer_id: farmer.id, device_token: deviceToken, platform },
    })

    return successResponse(
      { id: device.id, platform: device.platform, registered: true },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

/** Hapus token perangkat saat logout. */
export async function DELETE(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const body = await request.json().catch(() => ({}))
    const deviceToken = body?.device_token
    if (!deviceToken) {
      return validationErrorResponse([
        { field: 'device_token', message: 'Token perangkat wajib diisi.' },
      ])
    }

    await prisma.farmerDevice.deleteMany({
      where: { farmer_id: farmer.id, device_token: deviceToken },
    })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
