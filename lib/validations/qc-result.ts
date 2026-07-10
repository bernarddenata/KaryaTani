import { z } from 'zod'

export const qcResultStatusEnum = z.enum(['DRAFT', 'DIKIRIM', 'DISETUJUI', 'DIKOREKSI', 'DIBATALKAN'])

export const gradeBreakdownSchema = z.object({
  grade_name: z.string().min(1, 'Nama grade wajib diisi.'),
  grade_code: z.string().min(1, 'Kode grade wajib diisi.'),
  weight: z.number().min(0, 'Berat tidak boleh negatif.'),
  reason: z.string().optional(),
})

export const qcResultItemSchema = z.object({
  qc_template_item_id: z.string().min(1),
  value_text: z.string().optional(),
  value_number: z.number().optional(),
  value_json: z.any().optional(),
  notes: z.string().optional(),
  proof_file_id: z.string().optional(),
})

export const submitQcResultSchema = z.object({
  final_grade_code: z.string().optional(),
  recommended_grade_code: z.string().optional(),
  total_weight_checked: z.number().optional(),
  final_accepted_weight: z.number().optional(),
  total_rejected_weight: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(qcResultItemSchema),
  grade_breakdowns: z.array(gradeBreakdownSchema).min(1, 'Minimal satu grade breakdown wajib diisi.'),
})

export type SubmitQcResultInput = z.infer<typeof submitQcResultSchema>
export type GradeBreakdownInput = z.infer<typeof gradeBreakdownSchema>
