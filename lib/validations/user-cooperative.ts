import { z } from 'zod'

export const assignmentTypeEnum = z.enum([
  'PEGAWAI',
  'ADMIN_KOPERASI',
  'PETUGAS_QC',
  'SUPERVISOR_QC',
  'STAFF_KEUANGAN',
  'MANAGER',
  'VIEWER',
])

export const createUserCooperativeSchema = z.object({
  cooperative_id: z.string().uuid('ID koperasi tidak valid.'),
  assignment_type: assignmentTypeEnum.default('PEGAWAI'),
  is_primary: z.boolean().optional(),
  status: z.enum(['AKTIF', 'NONAKTIF']).optional(),
})

export const updateUserCooperativeSchema = z.object({
  assignment_type: assignmentTypeEnum.optional(),
  is_primary: z.boolean().optional(),
  status: z.enum(['AKTIF', 'NONAKTIF']).optional(),
})

export type CreateUserCooperativeInput = z.infer<typeof createUserCooperativeSchema>
export type UpdateUserCooperativeInput = z.infer<typeof updateUserCooperativeSchema>
