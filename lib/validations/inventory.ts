import { z } from 'zod'

export const createWarehouseSchema = z.object({
  cooperative_id: z.string().uuid('ID koperasi tidak valid.'),
  code: z.string().min(1, 'Kode gudang wajib diisi.').max(30),
  name: z.string().min(1, 'Nama gudang wajib diisi.'),
  address: z.string().optional(),
  status: z.enum(['AKTIF', 'NONAKTIF']).optional(),
})

export const updateWarehouseSchema = createWarehouseSchema
  .omit({ cooperative_id: true })
  .partial()

export const createWarehouseLocationSchema = z.object({
  warehouse_id: z.string().uuid('ID gudang tidak valid.'),
  code: z.string().min(1, 'Kode lokasi wajib diisi.').max(30),
  name: z.string().min(1, 'Nama lokasi wajib diisi.'),
  location_type: z.enum([
    'TRANSIT',
    'STOK_BAIK',
    'STOK_RUSAK',
    'PENGIRIMAN',
    'PENYESUAIAN',
    'LAINNYA',
  ]),
  status: z.enum(['AKTIF', 'NONAKTIF']).optional(),
})

export const updateWarehouseLocationSchema = createWarehouseLocationSchema
  .omit({ warehouse_id: true })
  .partial()

const stockDocumentBase = {
  warehouse_id: z.string().uuid('ID gudang tidak valid.'),
  location_id: z.string().uuid('ID lokasi tidak valid.'),
  commodity_id: z.string().uuid('ID komoditas tidak valid.'),
  commodity_variant_id: z.string().uuid().nullable().optional(),
  grade_code: z.string().nullable().optional(),
  grade_name: z.string().nullable().optional(),
  batch_number: z.string().nullable().optional(),
  quantity: z.number().positive('Jumlah harus lebih besar dari 0.'),
  notes: z.string().optional(),
  proof_file_id: z.string().uuid().nullable().optional(),
}

export const createStockAdjustmentSchema = z.object({
  ...stockDocumentBase,
  adjustment_type: z.enum(['TAMBAH', 'KURANG']),
  reason: z.string().min(1, 'Alasan wajib diisi.'),
})

export const createStockDisposalSchema = z.object({
  ...stockDocumentBase,
  reason: z.string().min(1, 'Alasan pemusnahan wajib diisi.'),
  disposal_date: z.string().optional(),
})

export const createStockDeliverySchema = z.object({
  ...stockDocumentBase,
  destination_type: z.enum([
    'PEMBELI',
    'KOPERASI_LAIN',
    'GUDANG_LAIN',
    'PROGRAM_PEMERINTAH',
    'LAINNYA',
  ]),
  destination_name: z.string().min(1, 'Nama tujuan wajib diisi.'),
  delivery_date: z.string().optional(),
  document_file_id: z.string().uuid().nullable().optional(),
})

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type CreateWarehouseLocationInput = z.infer<typeof createWarehouseLocationSchema>
export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>
export type CreateStockDisposalInput = z.infer<typeof createStockDisposalSchema>
export type CreateStockDeliveryInput = z.infer<typeof createStockDeliverySchema>
