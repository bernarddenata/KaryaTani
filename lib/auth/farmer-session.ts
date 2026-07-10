import { NextRequest } from 'next/server'
import { verifyFarmerToken } from '@/lib/auth/farmer-jwt'
import prisma from '@/lib/prisma/client'

export interface FarmerWithCooperative {
  id: string
  cooperative_id: string
  farmer_number: string
  name: string
  phone: string
  nik: string | null
  address: string | null
  village: string | null
  seller_type: string
  photo_url: string | null
  verification_status: string
  status: string
  app_activated_at: Date | null
  cooperative: {
    id: string
    code: string
    name: string
    status: string
  }
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookieToken = request.cookies.get('farmer_token')?.value
  if (cookieToken) return cookieToken
  return null
}

export async function getCurrentFarmer(request: NextRequest): Promise<FarmerWithCooperative | null> {
  const token = extractToken(request)
  if (!token) return null

  const payload = verifyFarmerToken(token)
  if (!payload) return null

  const farmer = await prisma.farmer.findUnique({
    where: { id: payload.farmerId },
    include: {
      cooperative: {
        select: { id: true, code: true, name: true, status: true },
      },
    },
  })

  if (!farmer || farmer.status !== 'ACTIVE' || !farmer.app_activated_at) return null

  return farmer as FarmerWithCooperative
}

export async function requireFarmerAuth(request: NextRequest): Promise<FarmerWithCooperative> {
  const farmer = await getCurrentFarmer(request)
  if (!farmer) throw new Error('UNAUTHORIZED')
  return farmer
}
