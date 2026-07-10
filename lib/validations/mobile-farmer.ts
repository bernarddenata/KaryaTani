import { z } from 'zod'

export const mobileLoginSchema = z.object({
  identifier: z.string().min(1, 'Nomor HP atau nomor anggota wajib diisi'),
  pin: z.string().min(1, 'PIN wajib diisi'),
})

export const mobileRegisterSchema = z.object({
  identifier: z.string().min(10, 'Nomor HP atau nomor anggota minimal 10 karakter').max(30),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d{6}$/, 'PIN harus 6 digit angka'),
})

export const mobileChangePinSchema = z.object({
  current_pin: z.string().length(6, 'PIN lama harus 6 digit'),
  new_pin: z.string().length(6, 'PIN baru harus 6 digit').regex(/^\d{6}$/, 'PIN harus 6 digit angka'),
})

export const mobileCreateDisputeSchema = z.object({
  reason_category: z.enum([
    'WEIGHT_MISMATCH',
    'GRADE_DISAGREEMENT',
    'REJECTED_WEIGHT_DISAGREEMENT',
    'PRICE_MISMATCH',
    'PAYMENT_MISMATCH',
    'OTHER',
  ]),
  farmer_note: z.string().min(1, 'Catatan wajib diisi').max(2000),
  evidence_photo_ids: z.array(z.string().uuid()).optional(),
})
