import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createFarmerSaleSchema } from '@/lib/validations/farmer-sale'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { generateSaleNumber, generateBatchNumber } from '@/lib/utils/numbering'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const farmerId = searchParams.get('farmer_id')
    const cooperativeId = searchParams.get('cooperative_id')
    const commodityId = searchParams.get('commodity_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const where: any = {}

    if (status) where.status = status
    if (farmerId) where.farmer_id = farmerId
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (commodityId) where.commodity_id = commodityId

    if (dateFrom || dateTo) {
      where.received_at = {}
      if (dateFrom) where.received_at.gte = new Date(dateFrom)
      if (dateTo) where.received_at.lte = new Date(dateTo)

      if (!dateFrom || !dateTo) {
        where.created_at = where.created_at || {}
        if (dateFrom && !dateTo) {
          where.OR = [
            { received_at: { gte: new Date(dateFrom) } },
            { received_at: null, created_at: { gte: new Date(dateFrom) } },
          ]
          delete where.received_at
        }
        if (dateTo && !dateFrom) {
          where.OR = [
            { received_at: { lte: new Date(dateTo) } },
            { received_at: null, created_at: { lte: new Date(dateTo) } },
          ]
          delete where.received_at
        }
      }
    }

    if (search) {
      where.OR = [
        { sale_number: { contains: search, mode: 'insensitive' } },
        { batch_number: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, sales] = await Promise.all([
      prisma.farmerSale.count({ where }),
      prisma.farmerSale.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, farmer_number: true, photo_url: true } },
          representative: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, code: true, image_url: true } },
          commodity_variant: { select: { id: true, name: true } },
          cooperative: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse(sales, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createFarmerSaleSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const saleNumber = await generateSaleNumber()

    const commodity = await prisma.commodity.findUnique({
      where: { id: parsed.data.commodity_id },
    })
    if (!commodity) {
      return validationErrorResponse([
        { field: 'commodity_id', message: 'Komoditas tidak ditemukan.' },
      ])
    }

    const batchNumber = await generateBatchNumber(commodity.code)

    const now = new Date()

    let priceListId = parsed.data.price_list_id
    if (!priceListId) {
      const priceList = await prisma.priceList.findFirst({
        where: {
          cooperative_id: parsed.data.cooperative_id,
          status: 'AKTIF',
          valid_from: { lte: now },
          OR: [{ valid_until: null }, { valid_until: { gte: now } }],
        },
      })
      if (priceList) priceListId = priceList.id
    }

    let qcTemplateId = parsed.data.qc_template_id
    if (!qcTemplateId) {
      const qcTemplate = await prisma.qcTemplate.findFirst({
        where: {
          cooperative_id: parsed.data.cooperative_id,
          commodity_id: parsed.data.commodity_id,
          status: 'AKTIF',
          valid_from: { lte: now },
          OR: [{ valid_until: null }, { valid_until: { gte: now } }],
        },
      })
      if (qcTemplate) qcTemplateId = qcTemplate.id
    }

    if (parsed.data.representative_id) {
      const rep = await prisma.farmerRepresentative.findFirst({
        where: {
          id: parsed.data.representative_id,
          farmer_id: parsed.data.farmer_id,
        },
      })
      if (!rep) {
        return validationErrorResponse([
          { field: 'representative_id', message: 'Perwakilan tidak terdaftar untuk petani ini.' },
        ])
      }
    }

    const receivedAt = parsed.data.received_weight
      ? (parsed.data.received_at ? new Date(parsed.data.received_at) : now)
      : (parsed.data.received_at ? new Date(parsed.data.received_at) : undefined)

    const sale = await prisma.farmerSale.create({
      data: {
        cooperative_id: parsed.data.cooperative_id,
        farmer_id: parsed.data.farmer_id,
        representative_id: parsed.data.representative_id || null,
        commodity_id: parsed.data.commodity_id,
        commodity_variant_id: parsed.data.commodity_variant_id || null,
        price_list_id: priceListId || null,
        qc_template_id: qcTemplateId || null,
        sale_number: saleNumber,
        batch_number: batchNumber,
        initial_weight: parsed.data.initial_weight,
        received_weight: parsed.data.received_weight,
        status: 'MENUNGGU_QC',
        notes: parsed.data.notes || null,
        received_at: receivedAt,
        received_by_user_id: parsed.data.received_weight ? user.id : null,
      },
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
      entityId: sale.id,
      action: 'CREATE',
      afterJson: sale,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(sale, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
