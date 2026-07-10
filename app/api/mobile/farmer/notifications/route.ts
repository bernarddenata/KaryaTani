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
    const isReadRaw = searchParams.get('is_read')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where: any = { farmer_id: farmer.id }
    if (isReadRaw === 'true') where.is_read = true
    if (isReadRaw === 'false') where.is_read = false

    const [total, notifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { farmer_id: farmer.id, is_read: false } }),
    ])

    return successResponse(
      notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        related_entity_type: n.related_entity_type,
        related_entity_id: n.related_entity_id,
        is_read: n.is_read,
        created_at: n.created_at,
      })),
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unread_count: unreadCount,
      }
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
