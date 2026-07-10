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
    const mutationType = searchParams.get('mutation_type')

    const where: any = { farmer_id: farmer.id }
    if (mutationType) where.mutation_type = mutationType

    const [total, mutations] = await Promise.all([
      prisma.farmerWalletMutation.count({ where }),
      prisma.farmerWalletMutation.findMany({
        where,
        select: {
          id: true,
          mutation_type: true,
          reference_type: true,
          reference_id: true,
          amount_in: true,
          amount_out: true,
          balance_before: true,
          balance_after: true,
          notes: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(mutations, {
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
