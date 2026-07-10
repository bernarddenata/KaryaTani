import { z } from 'zod'

export const farmerRegisterSchema = z.object({
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d{6}$/, 'PIN harus 6 digit angka'),
})

export const farmerLoginSchema = z.object({
  phone: z.string().min(1, 'Nomor HP wajib diisi'),
  pin: z.string().min(1, 'PIN wajib diisi'),
})

export const farmerUpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  photo_url: z.string().nullable().optional(),
})

export const farmerChangePinSchema = z.object({
  current_pin: z.string().length(6, 'PIN lama harus 6 digit'),
  new_pin: z.string().length(6, 'PIN baru harus 6 digit').regex(/^\d{6}$/, 'PIN harus 6 digit angka'),
})

export const farmerCreateDisputeSchema = z.object({
  farmer_sale_id: z.string().uuid('ID penjualan tidak valid'),
  reason_category: z.string().min(1, 'Kategori alasan wajib diisi'),
  farmer_note: z.string().min(1, 'Catatan wajib diisi'),
})
