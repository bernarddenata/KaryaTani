import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { submissionStatus, toDecimal } from '@/lib/utils/mobile-labels'
import { buildEstimatedPayment } from '@/lib/mobile/transforms'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

function greetingName(fullName: string): string {
  const first = fullName.split(' ')[0]
  if (!first) return fullName
  if (/^ibu|bu/i.test(first) || /^bapak|pak/i.test(first)) return fullName
  return `Pak ${first}`
}

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const [
      activeSubmissions,
      waitingQc,
      qcCompleted,
      paymentPending,
      activeDisputes,
      latestSale,
      recentActivities,
    ] = await Promise.all([
      prisma.farmerSale.count({
        where: {
          farmer_id: farmer.id,
          status: {
            in: ['MENUNGGU_QC', 'QC_DIPROSES', 'QC_SELESAI', 'HARGA_DIHITUNG', 'MENUNGGU_PEMBAYARAN'],
          },
        },
      }),
      prisma.farmerSale.count({
        where: { farmer_id: farmer.id, status: 'MENUNGGU_QC' },
      }),
      prisma.farmerSale.count({
        where: { farmer_id: farmer.id, status: { in: ['QC_SELESAI', 'HARGA_DIHITUNG'] } },
      }),
      prisma.farmerSale.count({
        where: { farmer_id: farmer.id, status: 'MENUNGGU_PEMBAYARAN' },
      }),
      prisma.dispute.count({
        where: {
          farmer_id: farmer.id,
          status: { in: ['DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG'] },
        },
      }),
      prisma.farmerSale.findFirst({
        where: { farmer_id: farmer.id },
        include: {
          commodity: {
            select: { id: true, name: true, code: true, default_unit: true, image_url: true },
          },
          commodity_variant: { select: { id: true, name: true } },
          cooperative: { select: { id: true, name: true } },
          representative: { select: { id: true, name: true } },
          qc_results: {
            include: { grade_breakdowns: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
          disputes: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.findMany({
        where: { farmer_id: farmer.id },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ])

    let latestSubmission = null as any
    if (latestSale) {
      const status = submissionStatus(latestSale.status)
      latestSubmission = {
        id: latestSale.id,
        submission_number: latestSale.sale_number,
        batch_number: latestSale.batch_number,
        commodity_name: latestSale.commodity.name,
        commodity_image_url: latestSale.commodity.image_url,
        received_weight: toDecimal(latestSale.received_weight),
        status: status.code,
        status_label: status.label,
        estimated_payment: buildEstimatedPayment(latestSale),
        received_at: latestSale.received_at,
      }
    }

    return successResponse({
      greeting_name: greetingName(farmer.name),
      cards: {
        active_submissions: activeSubmissions,
        waiting_qc: waitingQc,
        qc_completed: qcCompleted,
        payment_pending: paymentPending,
        active_disputes: activeDisputes,
      },
      latest_submission: latestSubmission,
      recent_activities: recentActivities.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        timestamp: n.created_at,
      })),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
