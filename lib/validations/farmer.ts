import { z } from 'zod'

export const sellerTypeEnum = z.enum([
  'PEMILIK_LAHAN',
  'PENGGARAP',
  'PENYEWA_LAHAN',
  'KELOMPOK_TANI',
  'BADAN_USAHA',
  'PENGEPUL_TERVERIFIKASI',
  'LAINNYA',
])

export const createFarmerSchema = z.object({
  cooperative_id: z.string().min(1, 'ID koperasi wajib diisi.'),
  farmer_number: z.string().min(1, 'Nomor petani wajib diisi.'),
  name: z.string().min(1, 'Nama petani wajib diisi.'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi.'),
  nik: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  seller_type: sellerTypeEnum,
  verification_status: z.string().optional(),
})

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>
export type SellerType = z.infer<typeof sellerTypeEnum>
