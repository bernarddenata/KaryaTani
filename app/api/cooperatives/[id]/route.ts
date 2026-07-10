import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'cooperatives.view')) return forbiddenResponse()

    const { id } = await params

    const cooperative = await prisma.cooperative.findUnique({
      where: { id },
    })

    if (!cooperative) return notFoundResponse('Koperasi tidak ditemukan.')

    return successResponse(cooperative)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
