import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_representatives.view')) return forbiddenResponse()

    const { id } = await params

    const representatives = await prisma.farmerRepresentative.findMany({
      where: { farmer_id: id },
      orderBy: { created_at: 'desc' },
    })

    return successResponse(representatives)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
