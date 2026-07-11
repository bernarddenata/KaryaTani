// Impor relatif (bukan alias @/) agar bisa dipakai dari prisma/seed.ts via tsx.
import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'

/**
 * Layanan persediaan (inventory) Karya Tani Center.
 *
 * Semua perubahan stok WAJIB lewat applyStockMovement di dalam transaksi:
 * ia menghitung saldo sebelum/sesudah, menolak stok negatif, memperbarui
 * KaryaTani_stock_balances, dan menulis KaryaTani_stock_movements.
 */

type Tx = Prisma.TransactionClient

export const LOCATION_TYPES = {
  TRANSIT: 'TRANSIT',
  STOK_BAIK: 'STOK_BAIK',
  STOK_RUSAK: 'STOK_RUSAK',
  PENGIRIMAN: 'PENGIRIMAN',
  PENYESUAIAN: 'PENYESUAIAN',
  LAINNYA: 'LAINNYA',
} as const

export const MOVEMENT_TYPES = {
  STOK_MASUK: 'STOK_MASUK',
  PINDAH_LOKASI_KELUAR: 'PINDAH_LOKASI_KELUAR',
  PINDAH_LOKASI_MASUK: 'PINDAH_LOKASI_MASUK',
  PENYESUAIAN_TAMBAH: 'PENYESUAIAN_TAMBAH',
  PENYESUAIAN_KURANG: 'PENYESUAIAN_KURANG',
  PEMUSNAHAN_STOK: 'PEMUSNAHAN_STOK',
  PENGIRIMAN: 'PENGIRIMAN',
  KOREKSI: 'KOREKSI',
} as const

const DEFAULT_LOCATIONS = [
  { code: 'TRANSIT', name: 'Lokasi Transit', location_type: 'TRANSIT' },
  { code: 'STOK-BAIK', name: 'Stok Baik', location_type: 'STOK_BAIK' },
  { code: 'STOK-RUSAK', name: 'Stok Rusak / Ditolak', location_type: 'STOK_RUSAK' },
]

export class StockError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || 0
  if (typeof v === 'object' && v !== null && 'toNumber' in v) {
    return (v as { toNumber: () => number }).toNumber()
  }
  return 0
}

export async function ensureDefaultLocations(
  tx: Tx,
  warehouseId: string,
  cooperativeId: string
) {
  for (const def of DEFAULT_LOCATIONS) {
    const existing = await tx.warehouseLocation.findFirst({
      where: { warehouse_id: warehouseId, location_type: def.location_type },
    })
    if (!existing) {
      await tx.warehouseLocation.create({
        data: {
          warehouse_id: warehouseId,
          cooperative_id: cooperativeId,
          code: def.code,
          name: def.name,
          location_type: def.location_type,
          status: 'AKTIF',
        },
      })
    }
  }
}

export async function getOrCreateDefaultWarehouse(cooperativeId: string) {
  return prisma.$transaction(async (tx) => {
    let warehouse = await tx.warehouse.findFirst({
      where: { cooperative_id: cooperativeId, status: 'AKTIF' },
      orderBy: { created_at: 'asc' },
    })
    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: {
          cooperative_id: cooperativeId,
          code: 'DEFAULT',
          name: 'Gudang Utama',
          status: 'AKTIF',
        },
      })
    }
    await ensureDefaultLocations(tx, warehouse.id, cooperativeId)
    return warehouse
  })
}

export async function getLocationByType(
  warehouseId: string,
  locationType: string,
  tx: Tx | typeof prisma = prisma
) {
  return tx.warehouseLocation.findFirst({
    where: { warehouse_id: warehouseId, location_type: locationType, status: 'AKTIF' },
    orderBy: { created_at: 'asc' },
  })
}

export interface StockKey {
  cooperative_id: string
  warehouse_id: string
  location_id: string
  commodity_id: string
  commodity_variant_id?: string | null
  grade_code?: string | null
  grade_name?: string | null
  batch_number?: string | null
  unit: string
}

export interface MovementInput extends StockKey {
  movement_type: string
  quantity_in: number
  quantity_out: number
  reference_type?: string | null
  reference_id?: string | null
  notes?: string | null
  created_by_user_id?: string | null
}

/**
 * Terapkan satu mutasi stok di dalam transaksi.
 * Mengembalikan record StockMovement yang dibuat.
 */
export async function applyStockMovement(tx: Tx, input: MovementInput) {
  const qtyIn = input.quantity_in || 0
  const qtyOut = input.quantity_out || 0
  if (qtyIn < 0 || qtyOut < 0 || qtyIn + qtyOut === 0) {
    throw new StockError('INVALID_QUANTITY', 'Jumlah harus lebih besar dari 0.')
  }

  const balanceWhere = {
    cooperative_id: input.cooperative_id,
    warehouse_id: input.warehouse_id,
    location_id: input.location_id,
    commodity_id: input.commodity_id,
    commodity_variant_id: input.commodity_variant_id ?? null,
    grade_code: input.grade_code ?? null,
    batch_number: input.batch_number ?? null,
    unit: input.unit,
  }

  let balance = await tx.stockBalance.findFirst({ where: balanceWhere })
  const before = balance ? toNum(balance.quantity) : 0
  const after = before + qtyIn - qtyOut

  if (after < 0) {
    throw new StockError('INSUFFICIENT_STOCK', 'Stok tidak mencukupi.')
  }

  if (balance) {
    await tx.stockBalance.update({
      where: { id: balance.id },
      data: { quantity: after, grade_name: input.grade_name ?? balance.grade_name },
    })
  } else {
    balance = await tx.stockBalance.create({
      data: { ...balanceWhere, grade_name: input.grade_name ?? null, quantity: after },
    })
  }

  return tx.stockMovement.create({
    data: {
      cooperative_id: input.cooperative_id,
      warehouse_id: input.warehouse_id,
      location_id: input.location_id,
      commodity_id: input.commodity_id,
      commodity_variant_id: input.commodity_variant_id ?? null,
      grade_code: input.grade_code ?? null,
      grade_name: input.grade_name ?? null,
      batch_number: input.batch_number ?? null,
      unit: input.unit,
      movement_type: input.movement_type,
      quantity_in: qtyIn,
      quantity_out: qtyOut,
      balance_before: before,
      balance_after: after,
      reference_type: input.reference_type ?? null,
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? null,
      created_by_user_id: input.created_by_user_id ?? null,
    },
  })
}

/**
 * Flow 1: Penjualan diterima -> stok masuk Lokasi Transit. Idempoten.
 */
export async function receiveSaleToTransit(saleId: string, userId?: string) {
  const sale = await prisma.farmerSale.findUnique({
    where: { id: saleId },
    include: { commodity: { select: { default_unit: true } } },
  })
  if (!sale) throw new StockError('NOT_FOUND', 'Penjualan tidak ditemukan.')
  const received = toNum(sale.received_weight)
  if (received <= 0) return null

  const existing = await prisma.stockMovement.findFirst({
    where: {
      reference_type: 'FARMER_SALE',
      reference_id: saleId,
      movement_type: MOVEMENT_TYPES.STOK_MASUK,
    },
  })
  if (existing) return existing

  const warehouse = await getOrCreateDefaultWarehouse(sale.cooperative_id)
  const transit = await getLocationByType(warehouse.id, LOCATION_TYPES.TRANSIT)
  if (!transit) throw new StockError('NO_LOCATION', 'Lokasi Transit tidak ditemukan.')

  return prisma.$transaction(async (tx) => {
    const again = await tx.stockMovement.findFirst({
      where: {
        reference_type: 'FARMER_SALE',
        reference_id: saleId,
        movement_type: MOVEMENT_TYPES.STOK_MASUK,
      },
    })
    if (again) return again
    return applyStockMovement(tx, {
      cooperative_id: sale.cooperative_id,
      warehouse_id: warehouse.id,
      location_id: transit.id,
      commodity_id: sale.commodity_id,
      commodity_variant_id: sale.commodity_variant_id,
      batch_number: sale.batch_number,
      unit: sale.commodity.default_unit,
      movement_type: MOVEMENT_TYPES.STOK_MASUK,
      quantity_in: received,
      quantity_out: 0,
      reference_type: 'FARMER_SALE',
      reference_id: saleId,
      notes: `Penerimaan penjualan ${sale.sale_number}`,
      created_by_user_id: userId ?? sale.received_by_user_id,
    })
  })
}

/**
 * Flow 2: QC selesai -> pindahkan stok dari Transit ke Stok Baik (per grade)
 * atau Stok Rusak / Ditolak (reject). Idempoten per QC result.
 */
export async function moveQcResultToStock(qcResultId: string, userId?: string) {
  const qc = await prisma.qcResult.findUnique({
    where: { id: qcResultId },
    include: {
      grade_breakdowns: true,
      farmer_sale: { include: { commodity: { select: { default_unit: true } } } },
    },
  })
  if (!qc) throw new StockError('NOT_FOUND', 'Hasil QC tidak ditemukan.')
  if (qc.grade_breakdowns.length === 0) return []

  const existing = await prisma.stockMovement.findFirst({
    where: { reference_type: 'QC_RESULT', reference_id: qcResultId },
  })
  if (existing) return []

  const sale = qc.farmer_sale

  // Pastikan stok transit ada (untuk penjualan yang dibuat sebelum modul persediaan aktif).
  await receiveSaleToTransit(sale.id, userId)

  const warehouse = await getOrCreateDefaultWarehouse(sale.cooperative_id)
  const transit = await getLocationByType(warehouse.id, LOCATION_TYPES.TRANSIT)
  const good = await getLocationByType(warehouse.id, LOCATION_TYPES.STOK_BAIK)
  const bad = await getLocationByType(warehouse.id, LOCATION_TYPES.STOK_RUSAK)
  if (!transit || !good || !bad) {
    throw new StockError('NO_LOCATION', 'Lokasi gudang standar tidak lengkap.')
  }

  const unit = sale.commodity.default_unit

  return prisma.$transaction(async (tx) => {
    const again = await tx.stockMovement.findFirst({
      where: { reference_type: 'QC_RESULT', reference_id: qcResultId },
    })
    if (again) return []

    const movements = []
    for (const gb of qc.grade_breakdowns) {
      const qty = toNum(gb.weight)
      if (qty <= 0) continue
      const isReject =
        gb.grade_code === 'REJECT' || gb.grade_name.toLowerCase().includes('reject')
      const target = isReject ? bad : good

      movements.push(
        await applyStockMovement(tx, {
          cooperative_id: sale.cooperative_id,
          warehouse_id: warehouse.id,
          location_id: transit.id,
          commodity_id: sale.commodity_id,
          commodity_variant_id: sale.commodity_variant_id,
          batch_number: sale.batch_number,
          unit,
          movement_type: MOVEMENT_TYPES.PINDAH_LOKASI_KELUAR,
          quantity_in: 0,
          quantity_out: qty,
          reference_type: 'QC_RESULT',
          reference_id: qcResultId,
          notes: `QC ${sale.sale_number}: keluar transit (${gb.grade_name})`,
          created_by_user_id: userId ?? qc.qc_officer_user_id,
        })
      )
      movements.push(
        await applyStockMovement(tx, {
          cooperative_id: sale.cooperative_id,
          warehouse_id: warehouse.id,
          location_id: target.id,
          commodity_id: sale.commodity_id,
          commodity_variant_id: sale.commodity_variant_id,
          grade_code: gb.grade_code,
          grade_name: gb.grade_name,
          batch_number: sale.batch_number,
          unit,
          movement_type: MOVEMENT_TYPES.PINDAH_LOKASI_MASUK,
          quantity_in: qty,
          quantity_out: 0,
          reference_type: 'QC_RESULT',
          reference_id: qcResultId,
          notes: `QC ${sale.sale_number}: masuk ${target.name} (${gb.grade_name})`,
          created_by_user_id: userId ?? qc.qc_officer_user_id,
        })
      )
    }
    return movements
  })
}

/**
 * Flow 3: Penyesuaian Stok. Menerapkan dokumen penyesuaian ke saldo. Idempoten.
 */
export async function adjustStock(adjustmentId: string, userId?: string) {
  const adj = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    include: { commodity: { select: { default_unit: true } } },
  })
  if (!adj) throw new StockError('NOT_FOUND', 'Penyesuaian tidak ditemukan.')

  const existing = await prisma.stockMovement.findFirst({
    where: { reference_type: 'STOCK_ADJUSTMENT', reference_id: adjustmentId },
  })
  if (existing) {
    throw new StockError('ALREADY_APPLIED', 'Mutasi stok sudah pernah dibuat untuk dokumen ini.')
  }

  const isAdd = adj.adjustment_type === 'TAMBAH'
  return prisma.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      cooperative_id: adj.cooperative_id,
      warehouse_id: adj.warehouse_id,
      location_id: adj.location_id,
      commodity_id: adj.commodity_id,
      commodity_variant_id: adj.commodity_variant_id,
      grade_code: adj.grade_code,
      grade_name: adj.grade_name,
      batch_number: adj.batch_number,
      unit: adj.commodity.default_unit,
      movement_type: isAdd
        ? MOVEMENT_TYPES.PENYESUAIAN_TAMBAH
        : MOVEMENT_TYPES.PENYESUAIAN_KURANG,
      quantity_in: isAdd ? toNum(adj.quantity) : 0,
      quantity_out: isAdd ? 0 : toNum(adj.quantity),
      reference_type: 'STOCK_ADJUSTMENT',
      reference_id: adjustmentId,
      notes: `${adj.adjustment_number}: ${adj.reason}`,
      created_by_user_id: userId ?? adj.created_by_user_id,
    })
    await tx.stockAdjustment.update({
      where: { id: adjustmentId },
      data: { status: 'DISETUJUI' },
    })
    return movement
  })
}

/**
 * Flow 4: Pemusnahan Stok. Idempoten.
 */
export async function disposeStock(disposalId: string, userId?: string) {
  const disposal = await prisma.stockDisposal.findUnique({
    where: { id: disposalId },
    include: { commodity: { select: { default_unit: true } } },
  })
  if (!disposal) throw new StockError('NOT_FOUND', 'Pemusnahan tidak ditemukan.')

  const existing = await prisma.stockMovement.findFirst({
    where: { reference_type: 'STOCK_DISPOSAL', reference_id: disposalId },
  })
  if (existing) {
    throw new StockError('ALREADY_APPLIED', 'Mutasi stok sudah pernah dibuat untuk dokumen ini.')
  }

  return prisma.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      cooperative_id: disposal.cooperative_id,
      warehouse_id: disposal.warehouse_id,
      location_id: disposal.location_id,
      commodity_id: disposal.commodity_id,
      commodity_variant_id: disposal.commodity_variant_id,
      grade_code: disposal.grade_code,
      grade_name: disposal.grade_name,
      batch_number: disposal.batch_number,
      unit: disposal.commodity.default_unit,
      movement_type: MOVEMENT_TYPES.PEMUSNAHAN_STOK,
      quantity_in: 0,
      quantity_out: toNum(disposal.quantity),
      reference_type: 'STOCK_DISPOSAL',
      reference_id: disposalId,
      notes: `${disposal.disposal_number}: ${disposal.reason}`,
      created_by_user_id: userId ?? disposal.created_by_user_id,
    })
    await tx.stockDisposal.update({
      where: { id: disposalId },
      data: { status: 'SELESAI' },
    })
    return movement
  })
}

/**
 * Flow 5: Pengiriman. Idempoten.
 */
export async function deliverStock(deliveryId: string, userId?: string) {
  const delivery = await prisma.stockDelivery.findUnique({
    where: { id: deliveryId },
    include: { commodity: { select: { default_unit: true } } },
  })
  if (!delivery) throw new StockError('NOT_FOUND', 'Pengiriman tidak ditemukan.')

  const existing = await prisma.stockMovement.findFirst({
    where: { reference_type: 'STOCK_DELIVERY', reference_id: deliveryId },
  })
  if (existing) {
    throw new StockError('ALREADY_APPLIED', 'Mutasi stok sudah pernah dibuat untuk dokumen ini.')
  }

  return prisma.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      cooperative_id: delivery.cooperative_id,
      warehouse_id: delivery.warehouse_id,
      location_id: delivery.location_id,
      commodity_id: delivery.commodity_id,
      commodity_variant_id: delivery.commodity_variant_id,
      grade_code: delivery.grade_code,
      grade_name: delivery.grade_name,
      batch_number: delivery.batch_number,
      unit: delivery.commodity.default_unit,
      movement_type: MOVEMENT_TYPES.PENGIRIMAN,
      quantity_in: 0,
      quantity_out: toNum(delivery.quantity),
      reference_type: 'STOCK_DELIVERY',
      reference_id: deliveryId,
      notes: `${delivery.delivery_number}: ke ${delivery.destination_name}`,
      created_by_user_id: userId ?? delivery.created_by_user_id,
    })
    await tx.stockDelivery.update({
      where: { id: deliveryId },
      data: { status: 'SELESAI' },
    })
    return movement
  })
}
