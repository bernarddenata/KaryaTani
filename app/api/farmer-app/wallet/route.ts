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

    const wallet = await prisma.farmerWallet.findFirst({
      where: { farmer_id: farmer.id },
      include: {
        cooperative: { select: { id: true, name: true } },
      },
    })

    if (!wallet) {
      return successResponse({
        available_balance: 0,
        held_balance: 0,
        total_paid: 0,
        cooperative: farmer.cooperative,
      })
    }

    return successResponse({
      id: wallet.id,
      available_balance: wallet.available_balance,
      held_balance: wallet.held_balance,
      total_paid: wallet.total_paid,
      cooperative: wallet.cooperative,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
