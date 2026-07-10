import { z } from 'zod'

export const relationshipTypeEnum = z.enum([
  'PEGAWAI',
  'KELUARGA',
  'SOPIR',
  'BURUH_TANI',
  'KETUA_KELOMPOK',
  'KUASA',
  'LAINNYA',
])

export const createRepresentativeSchema = z.object({
  farmer_id: z.string().min(1, 'Pilih petani terlebih dahulu.'),
  name: z.string().min(1, 'Nama pengantar wajib diisi.'),
  phone: z.string().optional(),
  relationship_type: relationshipTypeEnum,
  identity_number: z.string().optional(),
})

export const updateRepresentativeSchema = createRepresentativeSchema.partial().omit({ farmer_id: true })

export type CreateRepresentativeInput = z.infer<typeof createRepresentativeSchema>
export type RelationshipType = z.infer<typeof relationshipTypeEnum>
