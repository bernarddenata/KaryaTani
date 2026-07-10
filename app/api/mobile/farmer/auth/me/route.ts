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

    const primarySource = await prisma.farmerSource.findFirst({
      where: { farmer_id: farmer.id },
      include: {
        main_commodity: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    return successResponse({
      id: farmer.id,
      farmer_id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      member_number: farmer.farmer_number,
      village: farmer.village,
      farm_location: primarySource?.location || null,
      main_commodity: primarySource?.main_commodity?.name || null,
      cooperative_name: farmer.cooperative.name,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
