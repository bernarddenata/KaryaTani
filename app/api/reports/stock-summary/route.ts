import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { applyCooperativeScope } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const round3 = (n: number) => Math.round(n * 1000) / 1000

type Bucket = { rows: number; quantity_by_unit: Record<string, number> }

function emptyBucket(): Bucket {
  return { rows: 0, quantity_by_unit: {} }
}

function addToBucket(bucket: Bucket, unit: string, quantity: number) {
  bucket.rows += 1
  bucket.quantity_by_unit[unit] = round3((bucket.quantity_by_unit[unit] || 0) + quantity)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'stock.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const cooperative_id = searchParams.get('cooperative_id')
    const warehouse_id = searchParams.get('warehouse_id')

    const baseWhere: any = {}
    if (cooperative_id) baseWhere.cooperative_id = cooperative_id
    if (warehouse_id) baseWhere.warehouse_id = warehouse_id

    const scopedWhere = await applyCooperativeScope(baseWhere, user)

    // Hari ini (waktu server) untuk pengiriman.
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Bulan kalender berjalan untuk pemusnahan.
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [balances, pengiriman_hari_ini, pemusnahan_bulan_ini] = await Promise.all([
      prisma.stockBalance.findMany({
        where: { ...scopedWhere, quantity: { gt: 0 } },
        select: {
          unit: true,
          quantity: true,
          location: { select: { location_type: true } },
        },
      }),
      prisma.stockDelivery.count({
        where: {
          ...scopedWhere,
          status: { in: ['SELESAI', 'DIKIRIM'] },
          delivery_date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.stockDisposal.count({
        where: {
          ...scopedWhere,
          status: 'SELESAI',
          disposal_date: { gte: monthStart, lt: nextMonthStart },
        },
      }),
    ])

    const total = emptyBucket()
    const transit = emptyBucket()
    const baik = emptyBucket()
    const rusak = emptyBucket()

    for (const b of balances) {
      const qty = Number(b.quantity)
      addToBucket(total, b.unit, qty)
      if (b.location.location_type === 'TRANSIT') addToBucket(transit, b.unit, qty)
      else if (b.location.location_type === 'STOK_BAIK') addToBucket(baik, b.unit, qty)
      else if (b.location.location_type === 'STOK_RUSAK') addToBucket(rusak, b.unit, qty)
    }

    return successResponse({
      total,
      transit,
      baik,
      rusak,
      pengiriman_hari_ini,
      pemusnahan_bulan_ini,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
