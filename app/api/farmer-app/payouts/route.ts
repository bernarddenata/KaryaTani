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
    const status = searchParams.get('status')

    const where: any = { farmer_id: farmer.id }
    if (status) where.status = status

    const [total, payouts] = await Promise.all([
      prisma.farmerPayout.count({ where }),
      prisma.farmerPayout.findMany({
        where,
        select: {
          id: true,
          payout_number: true,
          amount: true,
          payout_method: true,
          transfer_reference: true,
          status: true,
          paid_at: true,
          created_at: true,
          cooperative: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(payouts, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
