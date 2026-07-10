/**
 * Mapping between internal Bahasa Indonesia enum codes (stored in DB)
 * and the English status codes expected by the Karya Taniku mobile spec,
 * plus Indonesian human labels for the mobile UI.
 */

export const SUBMISSION_STATUS_MAP: Record<string, { code: string; label: string }> = {
  DRAFT: { code: 'DRAFT', label: 'Draft' },
  MENUNGGU_QC: { code: 'WAITING_QC', label: 'Menunggu QC' },
  QC_DIPROSES: { code: 'QC_IN_PROGRESS', label: 'QC Diproses' },
  QC_SELESAI: { code: 'QC_COMPLETED', label: 'QC Selesai' },
  HARGA_DIHITUNG: { code: 'QC_COMPLETED', label: 'QC Selesai' },
  MENUNGGU_PEMBAYARAN: { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' },
  DIBAYAR: { code: 'PAID', label: 'Dibayar' },
  KEBERATAN: { code: 'DISPUTED', label: 'Sengketa' },
  DIBATALKAN: { code: 'CANCELLED', label: 'Dibatalkan' },
}

export const DISPUTE_STATUS_MAP: Record<string, { code: string; label: string }> = {
  DIKIRIM: { code: 'SUBMITTED', label: 'Dikirim' },
  DALAM_REVIEW: { code: 'UNDER_REVIEW', label: 'Dalam Review' },
  PERLU_QC_ULANG: { code: 'RE_QC_REQUIRED', label: 'Perlu QC Ulang' },
  DISETUJUI: { code: 'APPROVED', label: 'Disetujui' },
  DITOLAK: { code: 'REJECTED', label: 'Ditolak' },
  SELESAI: { code: 'CLOSED', label: 'Selesai' },
}

export const PAYMENT_STATUS_MAP: Record<string, { code: string; label: string }> = {
  HARGA_DIHITUNG: { code: 'ESTIMATED', label: 'Estimasi' },
  MENUNGGU_PEMBAYARAN: { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' },
  BELUM_DIBAYAR: { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' },
  MENUNGGU_TRANSFER: { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' },
  SUDAH_DITRANSFER: { code: 'PAID', label: 'Dibayar' },
  DIBAYAR: { code: 'PAID', label: 'Dibayar' },
  DIBATALKAN: { code: 'CANCELLED', label: 'Dibatalkan' },
  GAGAL_TRANSFER: { code: 'CANCELLED', label: 'Dibatalkan' },
}

export const DISPUTE_REASON_MAP: Record<string, { code: string; label: string }> = {
  WEIGHT_MISMATCH: { code: 'WEIGHT_MISMATCH', label: 'Berat tidak sesuai' },
  GRADE_DISAGREEMENT: { code: 'GRADE_DISAGREEMENT', label: 'Grade tidak sesuai' },
  REJECTED_WEIGHT_DISAGREEMENT: {
    code: 'REJECTED_WEIGHT_DISAGREEMENT',
    label: 'Berat reject tidak sesuai',
  },
  PRICE_MISMATCH: { code: 'PRICE_MISMATCH', label: 'Harga tidak sesuai' },
  PAYMENT_MISMATCH: { code: 'PAYMENT_MISMATCH', label: 'Pembayaran tidak sesuai' },
  OTHER: { code: 'OTHER', label: 'Lainnya' },
  BERAT_TIDAK_SESUAI: { code: 'WEIGHT_MISMATCH', label: 'Berat tidak sesuai' },
  GRADE_TIDAK_SESUAI: { code: 'GRADE_DISAGREEMENT', label: 'Grade tidak sesuai' },
  BERAT_REJECT_TIDAK_SESUAI: {
    code: 'REJECTED_WEIGHT_DISAGREEMENT',
    label: 'Berat reject tidak sesuai',
  },
  HARGA_TIDAK_SESUAI: { code: 'PRICE_MISMATCH', label: 'Harga tidak sesuai' },
  PEMBAYARAN_TIDAK_SESUAI: { code: 'PAYMENT_MISMATCH', label: 'Pembayaran tidak sesuai' },
  LAINNYA: { code: 'OTHER', label: 'Lainnya' },
}

const REASON_CODE_TO_DB: Record<string, string> = {
  WEIGHT_MISMATCH: 'BERAT_TIDAK_SESUAI',
  GRADE_DISAGREEMENT: 'GRADE_TIDAK_SESUAI',
  REJECTED_WEIGHT_DISAGREEMENT: 'BERAT_REJECT_TIDAK_SESUAI',
  PRICE_MISMATCH: 'HARGA_TIDAK_SESUAI',
  PAYMENT_MISMATCH: 'PEMBAYARAN_TIDAK_SESUAI',
  OTHER: 'LAINNYA',
}

export function normalizeDisputeReason(code: string): string {
  return REASON_CODE_TO_DB[code] || code
}

export function submissionStatus(status: string): { code: string; label: string } {
  return SUBMISSION_STATUS_MAP[status] || { code: status, label: status }
}

export function disputeStatus(status: string): { code: string; label: string } {
  return DISPUTE_STATUS_MAP[status] || { code: status, label: status }
}

export function paymentStatusFromSale(sale: {
  status: string
  total_amount: unknown
  calculated_at: Date | null
}): { code: string; label: string } {
  if (sale.status === 'DIBAYAR') return { code: 'PAID', label: 'Dibayar' }
  if (sale.status === 'MENUNGGU_PEMBAYARAN')
    return { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' }
  if (sale.status === 'HARGA_DIHITUNG' || sale.calculated_at)
    return { code: 'ESTIMATED', label: 'Estimasi' }
  if (sale.status === 'DIBATALKAN') return { code: 'CANCELLED', label: 'Dibatalkan' }
  return { code: 'PAYMENT_PENDING', label: 'Menunggu Pembayaran' }
}

export function disputeReasonInfo(code: string): { code: string; label: string } {
  return DISPUTE_REASON_MAP[code] || { code, label: code }
}

export const NOTIFICATION_TYPES = {
  SUBMISSION_RECEIVED: 'Setoran diterima',
  QC_STARTED: 'QC dimulai',
  QC_COMPLETED: 'QC selesai',
  ESTIMATION_CREATED: 'Estimasi dibuat',
  PAYMENT_PENDING: 'Menunggu pembayaran',
  PAID: 'Pembayaran diterima',
  DISPUTE_SUBMITTED: 'Keberatan dikirim',
  DISPUTE_UNDER_REVIEW: 'Keberatan dalam review',
  DISPUTE_RESOLVED: 'Keberatan selesai',
} as const

export function toDecimal(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return 0
}
