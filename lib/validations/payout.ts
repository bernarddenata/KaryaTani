import { z } from 'zod'

export const payoutStatusEnum = z.enum([
  'BELUM_DIBAYAR', 'MENUNGGU_TRANSFER', 'SUDAH_DITRANSFER', 'GAGAL_TRANSFER', 'DIBATALKAN',
])

export const payoutMethodEnum = z.enum(['TRANSFER_BANK', 'TUNAI', 'LAINNYA'])

export const createPayoutSchema = z.object({
  farmer_id: z.string().min(1, 'Petani wajib dipilih.'),
  cooperative_id: z.string().min(1, 'Koperasi wajib dipilih.'),
  amount: z.number().positive('Jumlah pembayaran harus lebih dari 0.'),
  payout_method: payoutMethodEnum,
  transfer_reference: z.string().optional(),
  proof_file_id: z.string().optional(),
})

export const updatePayoutSchema = z.object({
  status: payoutStatusEnum.optional(),
  transfer_reference: z.string().optional(),
  proof_file_id: z.string().optional(),
})

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>
