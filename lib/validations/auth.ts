import { z } from 'zod'

export const loginSchema = z
  .object({
    email: z.string().email('Format email tidak valid.').optional(),
    identifier: z.string().min(1).optional(),
    password: z.string().min(1, 'Password wajib diisi.'),
  })
  .refine((v) => Boolean(v.email || v.identifier), {
    message: 'Email atau identifier wajib diisi.',
    path: ['identifier'],
  })

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(10, 'Refresh token wajib diisi.'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
