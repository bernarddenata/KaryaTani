import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/** Tandai semua notifikasi petani sebagai sudah dibaca. */
export async function PATCH(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const result = await prisma.notification.updateMany({
      where: { farmer_id: farmer.id, is_read: false },
      data: { is_read: true },
    })

    return successResponse({ marked_read: result.count })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
