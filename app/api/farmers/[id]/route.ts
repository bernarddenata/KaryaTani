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
    if (!hasPermission(user, 'farmers.view')) return forbiddenResponse()

    const { id } = await params

    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        cooperative: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        representatives: true,
      },
    })

    if (!farmer) return notFoundResponse('Petani tidak ditemukan.')

    return successResponse(farmer)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
