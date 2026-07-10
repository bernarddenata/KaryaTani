import { z } from 'zod'

export const qcTemplateStatusEnum = z.enum(['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'])
export const inputTypeEnum = z.enum(['ANGKA', 'PERSENTASE', 'PILIHAN', 'CHECKLIST', 'YA_TIDAK', 'FOTO', 'CATATAN'])

export const createQcTemplateSchema = z.object({
  cooperative_id: z.string().min(1, 'Koperasi wajib dipilih.'),
  commodity_id: z.string().min(1, 'Komoditas wajib dipilih.'),
  commodity_variant_id: z.string().optional(),
  name: z.string().min(1, 'Nama template wajib diisi.'),
  version: z.number().int().min(1).optional(),
  valid_from: z.string().min(1, 'Tanggal berlaku mulai wajib diisi.'),
  valid_until: z.string().optional(),
  status: qcTemplateStatusEnum.optional(),
})

export const updateQcTemplateSchema = createQcTemplateSchema.partial()

export const createQcTemplateItemSchema = z.object({
  item_name: z.string().min(1, 'Nama item QC wajib diisi.'),
  item_code: z.string().min(1, 'Kode item wajib diisi.'),
  input_type: inputTypeEnum,
  is_required: z.boolean().optional(),
  requires_proof: z.boolean().optional(),
  options_json: z.any().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  help_text: z.string().optional(),
  sort_order: z.number().optional(),
})

export const updateQcTemplateItemSchema = createQcTemplateItemSchema.partial()

export type CreateQcTemplateInput = z.infer<typeof createQcTemplateSchema>
export type CreateQcTemplateItemInput = z.infer<typeof createQcTemplateItemSchema>
