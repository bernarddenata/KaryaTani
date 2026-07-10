import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { toDecimal } from '@/lib/utils/mobile-labels'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

function percentage(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

function monthKey(date: Date | null | undefined): string {
  if (!date) return '-'
  return date.toISOString().slice(0, 7)
}

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const commodityId = searchParams.get('commodity_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const where: any = { farmer_id: farmer.id }
    if (commodityId) where.commodity_id = commodityId
    if (startDate || endDate) {
      where.created_at = {}
      if (startDate) where.created_at.gte = new Date(startDate)
      if (endDate) where.created_at.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const sales = await prisma.farmerSale.findMany({
      where,
      include: {
        commodity: { select: { id: true, name: true, default_unit: true } },
        qc_results: {
          include: { grade_breakdowns: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    })

    const items = sales.map((s) => {
      const qc = s.qc_results[0]
      const totalWeight = qc ? toDecimal(qc.total_weight_checked ?? s.received_weight) : toDecimal(s.received_weight)
      const gradeA = qc?.grade_breakdowns
        .filter((g) => g.grade_code === 'A' || /grade\s*a/i.test(g.grade_name))
        .reduce((sum, g) => sum + toDecimal(g.weight), 0) || 0
      const rejectWeight = qc ? toDecimal(qc.total_rejected_weight) : 0
      return {
        submission_id: s.id,
        submission_number: s.sale_number,
        batch_number: s.batch_number,
        commodity_id: s.commodity.id,
        commodity_name: s.commodity.name,
        unit: s.commodity.default_unit,
        received_at: s.received_at,
        received_weight: totalWeight,
        grade_a_weight: gradeA,
        reject_weight: rejectWeight,
        grade_a_percentage: percentage(gradeA, totalWeight),
        reject_percentage: percentage(rejectWeight, totalWeight),
      }
    })

    const totalSubmissions = sales.length
    const totalReceivedWeight = items.reduce((s, i) => s + i.received_weight, 0)
    const totalGradeA = items.reduce((s, i) => s + i.grade_a_weight, 0)
    const totalReject = items.reduce((s, i) => s + i.reject_weight, 0)

    const commodityCounts: Record<string, number> = {}
    for (const i of items) commodityCounts[i.commodity_name] = (commodityCounts[i.commodity_name] || 0) + 1
    const mainCommodity = Object.entries(commodityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const rejectionReasons = sales
      .flatMap((s) => s.qc_results.flatMap((qc) => qc.grade_breakdowns))
      .filter((g) => g.grade_code === 'REJECT' && g.reason)
      .map((g) => g.reason as string)
    const reasonCounts: Record<string, number> = {}
    for (const r of rejectionReasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1
    const mostCommonRejection = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const trendMap: Record<string, { gradeA: number; reject: number; total: number }> = {}
    for (const i of items) {
      const key = monthKey(i.received_at)
      if (!trendMap[key]) trendMap[key] = { gradeA: 0, reject: 0, total: 0 }
      trendMap[key].gradeA += i.grade_a_weight
      trendMap[key].reject += i.reject_weight
      trendMap[key].total += i.received_weight
    }
    const trend = Object.entries(trendMap)
      .filter(([k]) => k !== '-')
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([period, v]) => ({
        period,
        grade_a_percentage: percentage(v.gradeA, v.total),
        reject_percentage: percentage(v.reject, v.total),
      }))

    const insights: { title: string; message: string }[] = []
    if (trend.length >= 2) {
      const last = trend[trend.length - 1]
      const prev = trend[trend.length - 2]
      const diff = last.grade_a_percentage - prev.grade_a_percentage
      if (diff > 0) {
        insights.push({
          title: 'Grade A meningkat',
          message: `Grade A meningkat ${diff}% dari periode ${prev.period}.`,
        })
      } else if (diff < 0) {
        insights.push({
          title: 'Grade A menurun',
          message: `Grade A menurun ${Math.abs(diff)}% dari periode ${prev.period}.`,
        })
      }
    }
    if (mostCommonRejection) {
      insights.push({
        title: 'Saran kualitas',
        message: `Perhatikan penyebab utama reject: ${mostCommonRejection}.`,
      })
    }

    return successResponse({
      summary: {
        total_submissions: totalSubmissions,
        total_received_weight: totalReceivedWeight,
        average_grade_a_percentage: percentage(totalGradeA, totalReceivedWeight),
        average_reject_percentage: percentage(totalReject, totalReceivedWeight),
        main_commodity: mainCommodity,
        most_common_rejection_reason: mostCommonRejection,
      },
      trend,
      insights,
      items,
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
