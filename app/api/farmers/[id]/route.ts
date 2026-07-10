import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createFarmerSchema } from '@/lib/validations/farmer'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmers.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.farmer.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Petani tidak ditemukan.')

    const body = await request.json()
    const parsed = createFarmerSchema.partial().safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.farmer.update({
      where: { id },
      data: parsed.data,
      include: {
        cooperative: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Farmer',
      entityId: id,
      action: 'UPDATE',
      beforeJson: existing,
      afterJson: updated,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(updated)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
