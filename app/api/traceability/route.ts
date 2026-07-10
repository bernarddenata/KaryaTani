import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import { submissionStatus, toDecimal } from '@/lib/utils/mobile-labels'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const batchNumber = searchParams.get('batch_number')
    const submissionNumber = searchParams.get('submission_number')
    const farmerName = searchParams.get('farmer_name')
    const commodityId = searchParams.get('commodity_id')
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where: any = {}
    if (batchNumber) where.batch_number = { contains: batchNumber, mode: 'insensitive' }
    if (submissionNumber) where.sale_number = { contains: submissionNumber, mode: 'insensitive' }
    if (commodityId) where.commodity_id = commodityId
    if (farmerName) {
      where.farmer = { name: { contains: farmerName, mode: 'insensitive' } }
    }
    if (search) {
      where.OR = [
        { batch_number: { contains: search, mode: 'insensitive' } },
        { sale_number: { contains: search, mode: 'insensitive' } },
        { farmer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const sales = await prisma.farmerSale.findMany({
      where: scopedWhere,
      include: {
        farmer: { select: { id: true, name: true, farmer_number: true } },
        commodity: { select: { id: true, name: true, default_unit: true } },
        cooperative: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    return successResponse(
      sales.map((s) => {
        const status = submissionStatus(s.status)
        return {
          id: s.id,
          submission_number: s.sale_number,
          batch_number: s.batch_number,
          farmer_name: s.farmer.name,
          farmer_number: s.farmer.farmer_number,
          commodity_name: s.commodity.name,
          received_weight: toDecimal(s.received_weight),
          status: status.code,
          status_label: status.label,
          created_at: s.created_at,
        }
      })
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
