import { z } from 'zod'

export const createCommoditySchema = z.object({
  code: z.string().min(1, 'Kode komoditas wajib diisi.'),
  name: z.string().min(1, 'Nama komoditas wajib diisi.'),
  category: z.string().optional(),
  default_unit: z.string().min(1, 'Satuan default wajib diisi.'),
  description: z.string().optional(),
})

export type CreateCommodityInput = z.infer<typeof createCommoditySchema>
