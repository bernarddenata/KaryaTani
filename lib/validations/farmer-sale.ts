import { z } from 'zod'

export const saleStatusEnum = z.enum([
  'DRAFT', 'DITERIMA_KOPERASI', 'MENUNGGU_QC', 'QC_DIPROSES', 'QC_SELESAI',
  'HARGA_DIHITUNG', 'MENUNGGU_PEMBAYARAN', 'DIBAYAR', 'KEBERATAN', 'DIBATALKAN',
])

export const createFarmerSaleSchema = z.object({
  cooperative_id: z.string().min(1, 'Koperasi wajib dipilih.'),
  farmer_id: z.string().min(1, 'Pilih petani terlebih dahulu.'),
  representative_id: z.string().optional(),
  commodity_id: z.string().min(1, 'Komoditas wajib dipilih.'),
  commodity_variant_id: z.string().optional(),
  price_list_id: z.string().optional(),
  qc_template_id: z.string().optional(),
  initial_weight: z.number().positive('Berat awal harus lebih dari 0.').optional(),
  received_weight: z.number().positive('Berat diterima harus lebih dari 0.').optional(),
  notes: z.string().optional(),
  received_at: z.string().optional(),
})

export const updateFarmerSaleSchema = createFarmerSaleSchema.partial()

export type CreateFarmerSaleInput = z.infer<typeof createFarmerSaleSchema>
