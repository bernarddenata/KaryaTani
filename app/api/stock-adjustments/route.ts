import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope, canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import { createStockAdjustmentSchema } from '@/lib/validations/inventory'
import { generateAdjustmentNumber } from '@/lib/utils/numbering'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { adjustStock, StockError } from '@/lib/inventory/service'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const adjustmentInclude = {
  warehouse: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true, location_type: true } },
  commodity: { select: { id: true, code: true, name: true, default_unit: true } },
  commodity_variant: { select: { id: true, name: true } },
  created_by: { select: { id: true, name: true } },
  cooperative: { select: { id: true, code: true, name: true } },
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock_adjustments.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit
    const cooperative_id = searchParams.get('cooperative_id')
    const warehouse_id = searchParams.get('warehouse_id')
    const adjustment_type = searchParams.get('adjustment_type')
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (cooperative_id) where.cooperative_id = cooperative_id
    if (warehouse_id) where.warehouse_id = warehouse_id
    if (adjustment_type) where.adjustment_type = adjustment_type
    if (status) where.status = status
    if (date_from || date_to) {
      where.created_at = {}
      if (date_from) where.created_at.gte = new Date(date_from)
      if (date_to) where.created_at.lte = new Date(date_to + 'T23:59:59.999Z')
    }

    const scopedWhere = await applyCooperativeScope(where, user)

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where: scopedWhere,
        include: adjustmentInclude,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.stockAdjustment.count({ where: scopedWhere }),
    ])

    return successResponse(adjustments, {
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
    if (!hasPermission(user, 'stock_adjustments.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createStockAdjustmentSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const {
      warehouse_id,
      location_id,
      commodity_id,
      commodity_variant_id,
      grade_code,
      grade_name,
      batch_number,
      quantity,
      notes,
      proof_file_id,
      adjustment_type,
      reason,
    } = parsed.data

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouse_id },
      select: { id: true, cooperative_id: true },
    })
    if (!warehouse) return notFoundResponse('Gudang tidak ditemukan.')
    if (!(await canAccessCooperative(user, warehouse.cooperative_id))) {
      return errorResponse('FORBIDDEN', 'Anda tidak memiliki akses ke gudang ini.', undefined, 403)
    }

    const location = await prisma.warehouseLocation.findUnique({
      where: { id: location_id },
      select: { id: true, warehouse_id: true },
    })
    if (!location || location.warehouse_id !== warehouse_id) {
      return validationErrorResponse([
        { field: 'location_id', message: 'Lokasi tidak sesuai dengan gudang yang dipilih.' },
      ])
    }

    const adjustment_number = await generateAdjustmentNumber()

    const created = await prisma.stockAdjustment.create({
      data: {
        cooperative_id: warehouse.cooperative_id,
        warehouse_id,
        location_id,
        commodity_id,
        commodity_variant_id: commodity_variant_id || null,
        grade_code: grade_code || null,
        grade_name: grade_name || (grade_code ? grade_code : null),
        batch_number: batch_number || null,
        adjustment_number,
        adjustment_type,
        quantity,
        reason,
        notes: notes || null,
        proof_file_id: proof_file_id || null,
        status: 'DIKIRIM',
        created_by_user_id: user.id,
      },
    })

    const canApprove = hasPermission(user, 'stock_adjustments.approve')
    if (canApprove) {
      try {
        await adjustStock(created.id, user.id)
      } catch (err) {
        if (err instanceof StockError) {
          await prisma.stockAdjustment.delete({ where: { id: created.id } })
          return errorResponse(err.code, err.message, undefined, 422)
        }
        throw err
      }
    }

    const result = await prisma.stockAdjustment.findUnique({
      where: { id: created.id },
      include: adjustmentInclude,
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'StockAdjustment',
      entityId: created.id,
      action: 'CREATE',
      afterJson: result,
      sourceClient: 'web',
      ...meta,
    })
    if (canApprove) {
      await createAuditLog({
        actorUserId: user.id,
        entityType: 'StockAdjustment',
        entityId: created.id,
        action: 'APPROVE',
        beforeJson: created,
        afterJson: result,
        sourceClient: 'web',
        ...meta,
      })
    }

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
