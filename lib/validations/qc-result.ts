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
  overall_notes: z.string().optional(),
  qc_photo_file_ids: z.array(z.string().uuid()).optional(),
  deduction_amount: z.number().min(0).optional(),
  items: z.array(qcResultItemSchema).optional(),
  parameter_values: z
    .array(
      z.object({
        parameter_id: z.string().min(1).optional(),
        qc_template_item_id: z.string().min(1).optional(),
        value_text: z.string().optional(),
        value_number: z.number().optional(),
        value_json: z.any().optional(),
        notes: z.string().optional(),
        proof_file_id: z.string().optional(),
      })
    )
    .optional(),
  grade_breakdowns: z
    .array(
      z.object({
        grade_id: z.string().optional(),
        grade_name: z.string().optional(),
        grade_code: z.string().optional(),
        weight: z.number().min(0, 'Berat tidak boleh negatif.'),
        reason: z.string().optional(),
      })
    )
    .min(1, 'Minimal satu grade breakdown wajib diisi.'),
})

export const draftQcResultSchema = z.object({
  parameter_values: z
    .array(
      z.object({
        parameter_id: z.string().min(1).optional(),
        qc_template_item_id: z.string().min(1).optional(),
        value_text: z.string().optional(),
        value_number: z.number().optional(),
        value_json: z.any().optional(),
        notes: z.string().optional(),
        proof_file_id: z.string().optional(),
      })
    )
    .optional(),
  grade_breakdowns: z
    .array(
      z.object({
        grade_id: z.string().optional(),
        grade_name: z.string().optional(),
        grade_code: z.string().optional(),
        weight: z.number().min(0),
        reason: z.string().optional(),
      })
    )
    .optional(),
  overall_notes: z.string().optional(),
})

export const previewPaymentSchema = z.object({
  grade_breakdowns: z
    .array(
      z.object({
        grade_id: z.string().optional(),
        grade_code: z.string().optional(),
        grade_name: z.string().optional(),
        weight: z.number().min(0),
      })
    )
    .min(1, 'Minimal satu grade breakdown wajib diisi.'),
  deduction_amount: z.number().min(0).optional(),
})

export type SubmitQcResultInput = z.infer<typeof submitQcResultSchema>
export type GradeBreakdownInput = z.infer<typeof gradeBreakdownSchema>
export type DraftQcResultInput = z.infer<typeof draftQcResultSchema>
export type PreviewPaymentInput = z.infer<typeof previewPaymentSchema>
