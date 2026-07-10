import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_results.create')) return forbiddenResponse()

    const { saleId } = await params

    const sale = await prisma.farmerSale.findUnique({
      where: { id: saleId },
      include: {
        qc_template: {
          include: {
            items: { orderBy: { sort_order: 'asc' } },
          },
        },
        qc_results: {
          where: { status: 'DRAFT' },
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            items: true,
            grade_breakdowns: true,
          },
        },
      },
    })

    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    if (
      !['MENUNGGU_QC', 'DITERIMA_KOPERASI', 'QC_DIPROSES'].includes(sale.status)
    ) {
      return errorResponse(
        'INVALID_STATUS',
        'Penjualan tidak dalam status yang valid untuk memulai QC.',
        undefined,
        409
      )
    }

    if (!sale.qc_template_id) {
      return errorResponse(
        'NO_TEMPLATE',
        'Belum ada template QC untuk penjualan ini.',
        undefined,
        409
      )
    }

    const existingDraft = sale.qc_results[0]
    if (existingDraft) {
      if (sale.status !== 'QC_DIPROSES') {
        await prisma.farmerSale.update({
          where: { id: saleId },
          data: { status: 'QC_DIPROSES' },
        })
      }
      const merged = {
        ...existingDraft,
        qc_template: sale.qc_template,
      }
      return successResponse(merged)
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.farmerSale.update({
        where: { id: saleId },
        data: { status: 'QC_DIPROSES' },
      })

      const qcResult = await tx.qcResult.create({
        data: {
          farmer_sale_id: saleId,
          cooperative_id: sale.cooperative_id,
          farmer_id: sale.farmer_id,
          qc_template_id: sale.qc_template_id!,
          qc_officer_user_id: user.id,
          status: 'DRAFT',
        },
        include: {
          qc_template: {
            include: {
              items: { orderBy: { sort_order: 'asc' } },
            },
          },
        },
      })

      return qcResult
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerSale',
      entityId: saleId,
      action: 'UPDATE',
      afterJson: { status: 'QC_DIPROSES' },
      sourceClient: 'web',
      ...meta,
    })
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'QcResult',
      entityId: result.id,
      action: 'CREATE',
      afterJson: result,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
