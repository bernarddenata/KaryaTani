import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api/response'

function parseDate(input: string | null): { start: Date; end: Date; iso: string } {
  const base = input ? new Date(input) : new Date()
  if (isNaN(base.getTime())) {
    const now = new Date()
    return {
      start: new Date(now.setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
      iso: new Date().toISOString().slice(0, 10),
    }
  }
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base)
  end.setHours(23, 59, 59, 999)
  return { start, end, iso: start.toISOString().slice(0, 10) }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'qc_results.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const cooperativeId = searchParams.get('cooperative_id')
    const { start, end, iso } = parseDate(searchParams.get('date'))

    const scopeWhere: any = {}
    if (cooperativeId) scopeWhere.cooperative_id = cooperativeId

    const dayWhere = { ...scopeWhere, created_at: { gte: start, lte: end } }

    const [setoranHariIni, menungguQc, qcDiproses, qcSelesai, recentSubmissions, recentQcResults] =
      await Promise.all([
        prisma.farmerSale.count({ where: dayWhere }),
        prisma.farmerSale.count({
          where: { ...scopeWhere, status: { in: ['MENUNGGU_QC', 'DITERIMA_KOPERASI'] } },
        }),
        prisma.farmerSale.count({
          where: { ...scopeWhere, status: 'QC_DIPROSES' },
        }),
        prisma.farmerSale.count({
          where: {
            ...scopeWhere,
            status: { in: ['QC_SELESAI', 'HARGA_DIHITUNG', 'MENUNGGU_PEMBAYARAN'] },
            calculated_at: { gte: start, lte: end },
          },
        }),
        prisma.farmerSale.findMany({
          where: dayWhere,
          include: {
            farmer: { select: { id: true, name: true, farmer_number: true } },
            commodity: { select: { id: true, name: true, default_unit: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        }),
        prisma.qcResult.findMany({
          where: {
            ...(cooperativeId ? { cooperative_id: cooperativeId } : {}),
            status: 'DIKIRIM',
            submitted_at: { gte: start, lte: end },
          },
          include: {
            farmer: { select: { id: true, name: true } },
            farmer_sale: {
              select: {
                id: true,
                sale_number: true,
                batch_number: true,
                commodity: { select: { name: true, default_unit: true } },
                received_weight: true,
              },
            },
          },
          orderBy: { submitted_at: 'desc' },
          take: 5,
        }),
      ])

    const activities = [
      ...recentSubmissions.map((s) => ({
        id: s.id,
        type: 'SUBMISSION_CREATED',
        title: `Setoran ${s.commodity.name} dibuat`,
        description: `${s.farmer.name} - ${s.received_weight ?? '-'} ${s.commodity.default_unit}`,
        created_at: s.created_at,
      })),
      ...recentQcResults.map((r) => ({
        id: r.id,
        type: 'QC_COMPLETED',
        title: `QC selesai untuk ${r.farmer_sale.commodity.name}`,
        description: `${r.farmer.name} - ${r.farmer_sale.batch_number}`,
        created_at: r.submitted_at,
      })),
    ]
      .sort((a, b) => (new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()))
      .slice(0, 10)

    return successResponse({
      date: iso,
      setoran_hari_ini: setoranHariIni,
      menunggu_qc: menungguQc,
      qc_diproses: qcDiproses,
      qc_selesai: qcSelesai,
      recent_activities: activities,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
