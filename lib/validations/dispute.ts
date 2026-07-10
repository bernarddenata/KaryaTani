import { z } from 'zod'

export const disputeReasonEnum = z.enum([
  'BERAT_TIDAK_SESUAI', 'GRADE_TIDAK_SESUAI', 'BERAT_REJECT_TIDAK_SESUAI',
  'HARGA_TIDAK_SESUAI', 'PEMBAYARAN_TIDAK_SESUAI', 'LAINNYA',
])

export const disputeStatusEnum = z.enum([
  'DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG', 'DISETUJUI', 'DITOLAK', 'SELESAI',
])

export const createDisputeSchema = z.object({
  farmer_sale_id: z.string().min(1, 'Penjualan wajib dipilih.'),
  reason_category: disputeReasonEnum,
  farmer_note: z.string().min(1, 'Catatan keberatan wajib diisi.'),
})

export const resolveDisputeSchema = z.object({
  manager_decision: z.string().min(1, 'Keputusan wajib diisi.'),
  resolution_note: z.string().optional(),
  status: disputeStatusEnum,
  adjustment_amount: z.number().optional(),
})

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
