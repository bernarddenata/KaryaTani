import { z } from 'zod'

export const priceListStatusEnum = z.enum(['DRAFT', 'AKTIF', 'NONAKTIF', 'KEDALUWARSA'])

export const createPriceListSchema = z.object({
  cooperative_id: z.string().min(1, 'Koperasi wajib dipilih.'),
  name: z.string().min(1, 'Nama daftar harga wajib diisi.'),
  valid_from: z.string().min(1, 'Tanggal berlaku mulai wajib diisi.'),
  valid_until: z.string().optional(),
  status: priceListStatusEnum.optional(),
})

export const updatePriceListSchema = createPriceListSchema.partial()

export const createPriceListItemSchema = z.object({
  commodity_id: z.string().min(1, 'Komoditas wajib dipilih.'),
  commodity_variant_id: z.string().optional(),
  grade_name: z.string().min(1, 'Nama grade wajib diisi.'),
  grade_code: z.string().min(1, 'Kode grade wajib diisi.'),
  price_per_unit: z.number().min(0, 'Harga tidak boleh negatif.'),
  unit: z.string().min(1, 'Satuan wajib diisi.'),
  is_reject: z.boolean().optional(),
  sort_order: z.number().optional(),
})

export const updatePriceListItemSchema = createPriceListItemSchema.partial()

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>
export type CreatePriceListItemInput = z.infer<typeof createPriceListItemSchema>
