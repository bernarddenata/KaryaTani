import { z } from 'zod'

export const createCooperativeSchema = z.object({
  code: z.string().min(1, 'Kode koperasi wajib diisi.'),
  name: z.string().min(1, 'Nama koperasi wajib diisi.'),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  address: z.string().optional(),
  legal_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid.').optional().or(z.literal('')).transform(v => v || undefined),
})

export type CreateCooperativeInput = z.infer<typeof createCooperativeSchema>
