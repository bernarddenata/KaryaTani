import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = { farmer_id: farmer.id }
    if (unreadOnly) where.is_read = false

    const [total, notifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({
        where: { farmer_id: farmer.id, is_read: false },
      }),
    ])

    return successResponse(notifications, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unread_count: unreadCount,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const body = await request.json()
    const { notification_ids } = body

    if (Array.isArray(notification_ids) && notification_ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notification_ids },
          farmer_id: farmer.id,
        },
        data: { is_read: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { farmer_id: farmer.id, is_read: false },
        data: { is_read: true },
      })
    }

    return successResponse({ message: 'Notifikasi telah ditandai sebagai dibaca.' })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
