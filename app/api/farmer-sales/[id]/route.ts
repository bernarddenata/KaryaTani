import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { updateFarmerSaleSchema } from '@/lib/validations/farmer-sale'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
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
    if (!hasPermission(user, 'farmer_sales.view')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id },
      include: {
        farmer: {
          select: { id: true, name: true, farmer_number: true, phone: true, seller_type: true },
        },
        representative: {
          select: { id: true, name: true, phone: true, relationship_type: true },
        },
        commodity: {
          select: { id: true, name: true, code: true, default_unit: true },
        },
        commodity_variant: {
          select: { id: true, name: true },
        },
        cooperative: {
          select: { id: true, name: true, code: true },
        },
        price_list: {
          select: {
            id: true,
            name: true,
            items: true,
          },
        },
        qc_template: {
          select: { id: true, name: true },
        },
        received_by: {
          select: { id: true, name: true },
        },
        photos: {
          include: {
            file: true,
            uploaded_by: { select: { id: true, name: true } },
          },
        },
        qc_results: {
          include: {
            items: {
              include: { qc_template_item: true },
            },
            grade_breakdowns: true,
            qc_officer: { select: { id: true, name: true } },
          },
        },
        disputes: true,
      },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    return successResponse(sale)
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
    if (!hasPermission(user, 'farmer_sales.edit')) return forbiddenResponse()

    const { id } = await params

    const existing = await prisma.farmerSale.findUnique({
      where: { id },
    })

    if (!existing) return notFoundResponse('Penjualan tidak ditemukan.')

    if (existing.status !== 'DRAFT' && existing.status !== 'MENUNGGU_QC') {
      return errorResponse(
        'INVALID_STATUS',
        'Penjualan tidak dapat diubah pada status ini.'
      )
    }

    const body = await request.json()
    const parsed = updateFarmerSaleSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const updated = await prisma.farmerSale.update({
      where: { id },
      data: parsed.data,
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true } },
        commodity: { select: { id: true, name: true, code: true } },
        cooperative: { select: { id: true, name: true } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerSale',
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
