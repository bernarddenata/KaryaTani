import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { updateRepresentativeSchema } from '@/lib/validations/representative'
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
    if (!hasPermission(user, 'farmer_representatives.view'))
      return forbiddenResponse()

    const { id } = await params

    const representative = await prisma.farmerRepresentative.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            farmer_number: true,
            name: true,
            cooperative_id: true,
          },
        },
      },
    })

    if (!representative)
      return notFoundResponse('Pengantar tidak ditemukan.')
    if (!(await canAccessCooperative(user, representative.farmer.cooperative_id)))
      return notFoundResponse('Pengantar tidak ditemukan.')

    return successResponse(representative)
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
    if (!hasPermission(user, 'farmer_representatives.edit'))
      return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.farmerRepresentative.findUnique({
      where: { id },
    })
    if (!existing)
      return notFoundResponse('Pengantar tidak ditemukan.')

    const body = await request.json()
    const parsed = updateRepresentativeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.farmerRepresentative.update({
      where: { id },
      data: parsed.data,
      include: {
        farmer: {
          select: {
            id: true,
            farmer_number: true,
            name: true,
          },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerRepresentative',
      entityId: updated.id,
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
