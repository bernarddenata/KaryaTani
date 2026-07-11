import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createStockDisposalSchema } from '@/lib/validations/inventory'
import { generateDisposalNumber } from '@/lib/utils/numbering'
import { disposeStock, StockError } from '@/lib/inventory/service'
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

const disposalInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
  created_by: { select: { id: true, name: true } },
} as const

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_disposals.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const warehouse_id = searchParams.get('warehouse_id')
    const location_id = searchParams.get('location_id')
    const commodity_id = searchParams.get('commodity_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (location_id) where.location_id = location_id
    if (commodity_id) where.commodity_id = commodity_id
    if (status) where.status = status
    if (search) {
      where.disposal_number = { contains: search, mode: 'insensitive' }
    }
    if (date_from || date_to) {
      where.disposal_date = {}
      if (date_from) where.disposal_date.gte = new Date(date_from)
      if (date_to) where.disposal_date.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [disposals, total] = await Promise.all([
      prisma.stockDisposal.findMany({
        where: scopedWhere,
        include: disposalInclude,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.stockDisposal.count({ where: scopedWhere }),
    ])

    return successResponse(disposals, {
      page,
      limit,
      total,
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
    if (!hasPermission(user, 'stock_disposals.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createStockDisposalSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const data = parsed.data

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouse_id },
      select: { id: true, cooperative_id: true },
    })
    if (!warehouse) return notFoundResponse('Gudang tidak ditemukan.')
    if (!(await canAccessCooperative(user, warehouse.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    const location = await prisma.warehouseLocation.findUnique({
      where: { id: data.location_id },
      select: { id: true, warehouse_id: true },
    })
    if (!location || location.warehouse_id !== data.warehouse_id) {
      return validationErrorResponse([
        { field: 'location_id', message: 'Lokasi tidak sesuai dengan gudang yang dipilih.' },
      ])
    }

    const disposal_number = await generateDisposalNumber()

    const grade_code = data.grade_code || null
    const grade_name = data.grade_name || grade_code

    const disposal = await prisma.stockDisposal.create({
      data: {
        cooperative_id: warehouse.cooperative_id,
        warehouse_id: data.warehouse_id,
        location_id: data.location_id,
        commodity_id: data.commodity_id,
        commodity_variant_id: data.commodity_variant_id || null,
        grade_code,
        grade_name,
        batch_number: data.batch_number || null,
        disposal_number,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || null,
        proof_file_id: data.proof_file_id || null,
        disposal_date: data.disposal_date ? new Date(data.disposal_date) : new Date(),
        status: 'DIKIRIM',
        created_by_user_id: user.id,
      },
    })

    const canComplete = hasPermission(user, 'stock_disposals.approve')
    if (canComplete) {
      try {
        await disposeStock(disposal.id, user.id)
      } catch (err) {
        if (err instanceof StockError) {
          await prisma.stockDisposal.delete({ where: { id: disposal.id } })
          return errorResponse(err.code, err.message, undefined, 422)
        }
        throw err
      }
    }

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockDisposal',
      entityId: disposal.id,
      action: 'CREATE',
      afterJson: disposal,
      sourceClient: 'web',
      ...meta,
    })
    if (canComplete) {
      await createAuditLog({
        actorUserId: user.id,
        entityType: 'StockDisposal',
        entityId: disposal.id,
        action: 'APPROVE',
        sourceClient: 'web',
        ...meta,
      })
    }

    const fresh = await prisma.stockDisposal.findUnique({
      where: { id: disposal.id },
      include: disposalInclude,
    })

    return successResponse(fresh, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
