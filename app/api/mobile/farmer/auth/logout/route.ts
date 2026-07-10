import { NextRequest } from 'next/server'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { successResponse, serverErrorResponse } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (farmer) {
      const meta = getRequestMeta(request)
      await createAuditLog({
        entityType: 'Farmer',
        entityId: farmer.id,
        action: 'MOBILE_LOGOUT',
        sourceClient: 'mobile_farmer',
        ...meta,
      })
    }
    return successResponse({ message: 'Berhasil keluar dari aplikasi.' })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
