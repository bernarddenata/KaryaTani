import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { farmerUpdateProfileSchema } from '@/lib/validations/farmer-app'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const full = await prisma.farmer.findUnique({
      where: { id: farmer.id },
      include: {
        cooperative: {
          select: { id: true, code: true, name: true, address: true, status: true },
        },
        farmer_wallets: {
          select: { id: true, available_balance: true, held_balance: true, total_paid: true },
        },
        _count: {
          select: { farmer_sales: true, disputes: true },
        },
      },
    })

    if (!full) return unauthorizedResponse()

    return successResponse({
      id: full.id,
      farmer_number: full.farmer_number,
      name: full.name,
      phone: full.phone,
      nik: full.nik,
      address: full.address,
      village: full.village,
      seller_type: full.seller_type,
      photo_url: full.photo_url,
      verification_status: full.verification_status,
      status: full.status,
      app_activated_at: full.app_activated_at,
      cooperative: full.cooperative,
      wallet: full.farmer_wallets[0] || null,
      stats: {
        total_sales: full._count.farmer_sales,
        total_disputes: full._count.disputes,
      },
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
    const parsed = farmerUpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.farmer.update({
      where: { id: farmer.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        village: true,
        photo_url: true,
        updated_at: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
