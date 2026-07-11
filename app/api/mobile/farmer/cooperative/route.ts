import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/** Detail & kontak koperasi tempat petani terdaftar. */
export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const coop = await prisma.cooperative.findUnique({
      where: { id: farmer.cooperative_id },
      select: {
        id: true,
        code: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        village: true,
        district: true,
        city: true,
        province: true,
        legal_number: true,
        status: true,
      },
    })
    if (!coop) return unauthorizedResponse()

    return successResponse(coop)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
