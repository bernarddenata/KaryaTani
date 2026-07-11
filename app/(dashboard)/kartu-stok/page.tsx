'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDateTime } from '@/lib/utils/format'
import { useAuth } from '@/components/layout/auth-provider'

interface StockMovement {
  id: string
  movement_type: string
  quantity_in: string
  quantity_out: string
  balance_before: string
  balance_after: string
  unit: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  reference_type?: string
  reference_id?: string
  notes?: string
  created_at: string
  cooperative?: { id: string; code: string; name: string }
  warehouse?: { id: string; code: string; name: string }
  location?: { id: string; code: string; name: string; location_type: string }
  commodity?: { id: string; code: string; name: string; default_unit: string }
  commodity_variant?: { id: string; name: string }
  created_by?: { id: string; name: string }
}

interface Cooperative {
  id: string
  code: string
  name: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Commodity {
  id: string
  code: string
  name: string
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  STOK_MASUK: 'Stok Masuk',
  PINDAH_LOKASI_KELUAR: 'Pindah Lokasi (Keluar)',
  PINDAH_LOKASI_MASUK: 'Pindah Lokasi (Masuk)',
  PENYESUAIAN_TAMBAH: 'Penyesuaian Tambah',
  PENYESUAIAN_KURANG: 'Penyesuaian Kurang',
  PEMUSNAHAN_STOK: 'Pemusnahan Stok',
  PENGIRIMAN: 'Pengiriman',
  KOREKSI: 'Koreksi',
}

const MASUK_TYPES = ['STOK_MASUK', 'PINDAH_LOKASI_MASUK', 'PENYESUAIAN_TAMBAH']
const KELUAR_TYPES = ['PINDAH_LOKASI_KELUAR', 'PENYESUAIAN_KURANG', 'PEMUSNAHAN_STOK', 'PENGIRIMAN']

function movementBadgeClass(type: string): string {
  if (MASUK_TYPES.includes(type)) return 'bg-primary/15 text-primary'
  if (KELUAR_TYPES.includes(type)) return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

function formatQty(value: string | null | undefined, unit?: string): string {
  const num = parseFloat(value ?? '0')
  if (isNaN(num)) return '-'
  return `${num.toLocaleString('id-ID')} ${unit || ''}`.trim()
}

export default function KartuStokPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])

  const [cooperativeId, setCooperativeId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [commodityId, setCommodityId] = useState('')
  const [movementType, setMovementType] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false

  useEffect(() => {
    apiFetch<Cooperative[]>('/api/cooperatives').then((res) => {
      if (res.success && res.data) {
        setCooperatives(Array.isArray(res.data) ? res.data : [])
      }
    })
    apiFetch<Commodity[]>('/api/commodities').then((res) => {
      if (res.success && res.data) {
        setCommodities(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  useEffect(() => {
    if (!isGlobal && accessibleCoops.length === 1 && !cooperativeId) {
      setCooperativeId(accessibleCoops[0].id)
    }
  }, [isGlobal, accessibleCoops, cooperativeId])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (cooperativeId) params.set('cooperative_id', cooperativeId)
    apiFetch<Warehouse[]>(`/api/warehouses?${params.toString()}`).then((res) => {
      if (res.success && res.data) {
        setWarehouses(Array.isArray(res.data) ? res.data : [])
      }
    })
    setWarehouseId('')
  }, [cooperativeId])

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (cooperativeId) params.set('cooperative_id', cooperativeId)
      if (warehouseId) params.set('warehouse_id', warehouseId)
      if (commodityId) params.set('commodity_id', commodityId)
      if (movementType) params.set('movement_type', movementType)
      if (batchNumber.trim()) params.set('batch_number', batchNumber.trim())
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await apiFetch<StockMovement[]>(`/api/stock-movements?${params.toString()}`)
      if (res.success && res.data) {
        setMovements(Array.isArray(res.data) ? res.data : [])
        setTotal(res.meta?.total || 0)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [page, cooperativeId, warehouseId, commodityId, movementType, batchNumber, dateFrom, dateTo])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  function handleFilter() {
    setPage(1)
    fetchMovements()
  }

  const coopOptions = isGlobal
    ? cooperatives
    : cooperatives.filter((c) => accessibleCoops.some((a) => a.id === c.id))

  const columns: Column<StockMovement>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => (
        <span className="whitespace-nowrap">{formatDateTime(item.created_at)}</span>
      ),
    },
    {
      key: 'warehouse',
      label: 'Gudang / Lokasi',
      render: (item) => (
        <div>
          <p className="font-medium">{item.warehouse?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.location?.name || '-'}</p>
        </div>
      ),
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => (
        <div>
          <p className="font-medium">{item.commodity?.name || '-'}</p>
          {item.commodity_variant && (
            <p className="text-xs text-muted-foreground">{item.commodity_variant.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (item) => item.grade_name || item.grade_code || '-',
    },
    {
      key: 'batch_number',
      label: 'Batch',
      render: (item) => item.batch_number || '-',
    },
    {
      key: 'movement_type',
      label: 'Tipe Mutasi',
      render: (item) => (
        <Badge className={movementBadgeClass(item.movement_type)}>
          {MOVEMENT_TYPE_LABELS[item.movement_type] || item.movement_type}
        </Badge>
      ),
    },
    {
      key: 'quantity_in',
      label: 'Masuk',
      className: 'text-right',
      render: (item) =>
        parseFloat(item.quantity_in) > 0 ? (
          <span className="text-primary tabular-nums whitespace-nowrap">
            {formatQty(item.quantity_in, item.unit)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'quantity_out',
      label: 'Keluar',
      className: 'text-right',
      render: (item) =>
        parseFloat(item.quantity_out) > 0 ? (
          <span className="text-destructive tabular-nums whitespace-nowrap">
            {formatQty(item.quantity_out, item.unit)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'balance_before',
      label: 'Saldo Sebelum',
      className: 'text-right',
      render: (item) => (
        <span className="tabular-nums whitespace-nowrap">
          {formatQty(item.balance_before, item.unit)}
        </span>
      ),
    },
    {
      key: 'balance_after',
      label: 'Saldo Sesudah',
      className: 'text-right',
      render: (item) => (
        <span className="tabular-nums whitespace-nowrap font-medium">
          {formatQty(item.balance_after, item.unit)}
        </span>
      ),
    },
    {
      key: 'reference',
      label: 'Referensi',
      render: (item) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-muted-foreground">{item.reference_type || '-'}</p>
          {item.notes && (
            <p className="text-sm truncate" title={item.notes}>
              {item.notes}
            </p>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardShell
      title="Kartu Stok"
      description="Riwayat mutasi stok masuk dan keluar untuk setiap komoditas."
      permission="stock_movements.view"
    >
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {(isGlobal || accessibleCoops.length > 1) && (
          <div className="w-56">
            <Label className="text-sm text-muted-foreground mb-1 block">Koperasi</Label>
            <Select
              value={cooperativeId || 'ALL'}
              onValueChange={(v) => setCooperativeId(v === 'ALL' ? '' : (v ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Koperasi">
                  {(v: string | null) => {
                    if (!v || v === 'ALL') return 'Semua Koperasi'
                    const item = coopOptions.find((c) => c.id === v)
                    return item ? `${item.code} - ${item.name}` : v
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Koperasi</SelectItem>
                {coopOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Gudang</Label>
          <Select
            value={warehouseId || 'ALL'}
            onValueChange={(v) => setWarehouseId(v === 'ALL' ? '' : (v ?? ''))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Gudang">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Gudang'
                  const item = warehouses.find((w) => w.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Gudang</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Komoditas</Label>
          <Select
            value={commodityId || 'ALL'}
            onValueChange={(v) => setCommodityId(v === 'ALL' ? '' : (v ?? ''))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Komoditas">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Komoditas'
                  const item = commodities.find((c) => c.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Komoditas</SelectItem>
              {commodities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Label className="text-sm text-muted-foreground mb-1 block">Tipe Mutasi</Label>
          <Select
            value={movementType || 'ALL'}
            onValueChange={(v) => setMovementType(v === 'ALL' ? '' : (v ?? ''))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Tipe'
                  return MOVEMENT_TYPE_LABELS[v] || v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {Object.entries(MOVEMENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Batch</Label>
          <Input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="Nomor batch"
            className="w-36"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Dari Tanggal</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Sampai Tanggal</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleFilter} size="sm">
          Filter
        </Button>
      </div>

      {!isGlobal && accessibleCoops.length === 1 && (
        <p className="text-xs text-muted-foreground mb-4">
          Data dibatasi pada koperasi: <strong>{accessibleCoops[0].name}</strong>
        </p>
      )}

      <DataTable
        columns={columns}
        data={movements}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada riwayat mutasi stok."
      />
    </DashboardShell>
  )
}
