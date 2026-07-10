import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const { batchNumber } = await params

    const sale = await prisma.farmerSale.findFirst({
      where: { batch_number: batchNumber },
      include: {
        farmer: {
          select: { id: true, name: true, farmer_number: true, phone: true, seller_type: true, address: true },
        },
        representative: {
          select: { id: true, name: true, phone: true, relationship_type: true },
        },
        cooperative: { select: { id: true, code: true, name: true } },
        commodity: { select: { id: true, code: true, name: true, category: true } },
        commodity_variant: { select: { id: true, name: true } },
        photos: {
          include: {
            file: true,
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
          orderBy: { created_at: 'desc' },
        },
        disputes: {
          include: {
            reviewed_by: { select: { id: true, name: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    })

    if (!sale) return notFoundResponse('Batch tidak ditemukan.')
    if (!(await canAccessCooperative(user, sale.cooperative_id)))
      return notFoundResponse('Batch tidak ditemukan.')

    // Get wallet mutations and payouts for this sale's farmer
    const [walletMutations, payouts, auditLogs] = await Promise.all([
      prisma.farmerWalletMutation.findMany({
        where: {
          farmer_id: sale.farmer_id,
          cooperative_id: sale.cooperative_id,
          reference_id: sale.id,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.farmerPayout.findMany({
        where: {
          farmer_id: sale.farmer_id,
          cooperative_id: sale.cooperative_id,
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: {
          entity_type: 'FarmerSale',
          entity_id: sale.id,
        },
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'asc' },
      }),
    ])

    return successResponse({
      sale,
      walletMutations,
      payouts,
      auditLogs,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
