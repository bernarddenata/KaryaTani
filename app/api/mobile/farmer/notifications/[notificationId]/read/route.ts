import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { notificationId } = await params

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, farmer_id: farmer.id },
    })
    if (!existing) return notFoundResponse('Notifikasi tidak ditemukan.')

    if (!existing.is_read) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { is_read: true },
      })
    }

    return successResponse({ id: notificationId, is_read: true })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
