import type { Prisma } from '@prisma/client'
import {
  submissionStatus,
  disputeStatus,
  paymentStatusFromSale,
  disputeReasonInfo,
  toDecimal,
} from '@/lib/utils/mobile-labels'

type SaleWithBasics = Prisma.FarmerSaleGetPayload<{
  include: {
    commodity: { select: { id: true; name: true; code: true; default_unit: true; image_url: true } }
    commodity_variant: { select: { id: true; name: true } }
    cooperative: { select: { id: true; name: true } }
    representative: { select: { id: true; name: true } }
    qc_results: { include: { grade_breakdowns: true } }
    disputes: true
  }
}>

export function buildEstimatedPayment(sale: SaleWithBasics): number {
  if (sale.total_amount !== null && sale.total_amount !== undefined) {
    return toDecimal(sale.total_amount)
  }
  const latest = sale.qc_results?.[0]
  if (!latest) return 0
  return latest.grade_breakdowns.reduce((sum, g) => sum + toDecimal(g.estimated_amount), 0)
}

export function submissionListItem(sale: SaleWithBasics) {
  const status = submissionStatus(sale.status)
  const activeDispute = sale.disputes?.find((d) =>
    ['DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG'].includes(d.status)
  )
  return {
    id: sale.id,
    submission_number: sale.sale_number,
    batch_number: sale.batch_number,
    commodity: {
      id: sale.commodity.id,
      name: sale.commodity.name,
      unit: sale.commodity.default_unit,
      image_url: sale.commodity.image_url,
    },
    commodity_variant: sale.commodity_variant
      ? { id: sale.commodity_variant.id, name: sale.commodity_variant.name }
      : null,
    representative: sale.representative
      ? { id: sale.representative.id, name: sale.representative.name }
      : null,
    initial_weight: toDecimal(sale.initial_weight),
    received_weight: toDecimal(sale.received_weight),
    status: status.code,
    status_label: status.label,
    received_at: sale.received_at,
    created_at: sale.created_at,
    estimated_payment: buildEstimatedPayment(sale),
    has_qc_result: (sale.qc_results?.length || 0) > 0,
    has_active_dispute: Boolean(activeDispute),
  }
}

type TimelineEntry = { status: string; label: string; timestamp: Date | string }

export function buildSubmissionTimeline(sale: SaleWithBasics): TimelineEntry[] {
  const timeline: TimelineEntry[] = []
  if (sale.received_at) {
    timeline.push({
      status: 'SUBMISSION_RECEIVED',
      label: 'Setoran diterima',
      timestamp: sale.received_at,
    })
  } else {
    timeline.push({
      status: 'DRAFT',
      label: 'Setoran dibuat',
      timestamp: sale.created_at,
    })
  }
  const qc = sale.qc_results?.[0]
  if (qc && qc.status === 'DRAFT') {
    timeline.push({
      status: 'QC_IN_PROGRESS',
      label: 'QC diproses',
      timestamp: qc.created_at,
    })
  }
  if (qc?.submitted_at) {
    timeline.push({
      status: 'QC_COMPLETED',
      label: 'QC selesai',
      timestamp: qc.submitted_at,
    })
  }
  if (sale.calculated_at) {
    timeline.push({
      status: 'ESTIMATION_CREATED',
      label: 'Estimasi dibuat',
      timestamp: sale.calculated_at,
    })
  }
  if (sale.status === 'MENUNGGU_PEMBAYARAN') {
    timeline.push({
      status: 'PAYMENT_PENDING',
      label: 'Menunggu pembayaran',
      timestamp: sale.updated_at,
    })
  }
  if (sale.status === 'DIBAYAR') {
    timeline.push({
      status: 'PAID',
      label: 'Pembayaran diterima',
      timestamp: sale.updated_at,
    })
  }
  if (sale.status === 'KEBERATAN') {
    const dispute = sale.disputes?.find((d) => d.status === 'DIKIRIM' || d.status === 'DALAM_REVIEW')
    if (dispute) {
      timeline.push({
        status: 'DISPUTED',
        label: 'Keberatan diajukan',
        timestamp: dispute.created_at,
      })
    }
  }
  if (sale.status === 'DIBATALKAN') {
    timeline.push({
      status: 'CANCELLED',
      label: 'Dibatalkan',
      timestamp: sale.updated_at,
    })
  }
  return timeline
}

export function disputeListItem(dispute: Prisma.DisputeGetPayload<{
  include: {
    farmer_sale: {
      select: { id: true; sale_number: true; batch_number: true; commodity: { select: { name: true } } }
    }
  }
}>) {
  const status = disputeStatus(dispute.status)
  const reason = disputeReasonInfo(dispute.reason_category)
  return {
    dispute_id: dispute.id,
    dispute_number: dispute.dispute_number,
    submission_id: dispute.farmer_sale.id,
    submission_number: dispute.farmer_sale.sale_number,
    batch_number: dispute.farmer_sale.batch_number,
    commodity_name: dispute.farmer_sale.commodity.name,
    reason_category: reason.code,
    reason_label: reason.label,
    status: status.code,
    status_label: status.label,
    created_at: dispute.created_at,
    resolved_at: dispute.resolved_at,
  }
}

export { paymentStatusFromSale, submissionStatus, disputeStatus, disputeReasonInfo, toDecimal }
