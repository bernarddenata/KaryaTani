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
      include: { main_commodity: { select: { id: true, name: true } } },
      orderBy: { created_at: 'asc' },
    })

    return successResponse({
      farmer_id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      member_number: farmer.farmer_number,
      nik: farmer.nik,
      address: farmer.address,
      village: farmer.village,
      farm_location: primarySource?.location || null,
      main_commodity: primarySource?.main_commodity?.name || null,
      seller_type: farmer.seller_type,
      photo_url: farmer.photo_url,
      verification_status: farmer.verification_status,
      cooperative_name: farmer.cooperative.name,
      cooperative_code: farmer.cooperative.code,
      status: farmer.status,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
