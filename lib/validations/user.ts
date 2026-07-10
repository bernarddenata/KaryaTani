import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  email: z.string().email('Format email tidak valid.'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  role_ids: z.array(z.string()).min(1, 'Minimal satu hak akses harus dipilih.'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.').optional(),
  email: z.string().email('Format email tidak valid.').optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role_ids: z.array(z.string()).optional(),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.').optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
