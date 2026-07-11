'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDateTime } from '@/lib/utils/format'
import { useAuth } from '@/components/layout/auth-provider'
import { Eye } from 'lucide-react'

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

interface WarehouseLocation {
  id: string
  code: string
  name: string
  location_type: string
}

interface Commodity {
  id: string
  code: string
  name: string
  default_unit: string
}

interface StockBalance {
  id: string
  quantity: string
  unit: string
  grade_code?: string | null
  grade_name?: string | null
  batch_number?: string | null
  updated_at: string
  cooperative?: Cooperative
  warehouse?: Warehouse
  location?: WarehouseLocation
  commodity?: Commodity
  commodity_variant?: { id: string; name: string } | null
}

interface StockMovement {
  id: string
  movement_type: string
  quantity_in: string
  quantity_out: string
  balance_before: string
  balance_after: string
  notes?: string | null
  created_at: string
  created_by?: { id: string; name: string } | null
}

interface StockBalanceDetail extends StockBalance {
  recent_movements: StockMovement[]
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  TRANSIT: 'Transit',
  STOK_BAIK: 'Stok Baik',
  STOK_RUSAK: 'Stok Rusak',
  PENGIRIMAN: 'Pengiriman',
  PENYESUAIAN: 'Penyesuaian',
  LAINNYA: 'Lainnya',
}

// Mengikuti resep badge di lib/utils/format.ts (design-tokens.md §5).
const LOCATION_TYPE_COLORS: Record<string, string> = {
  TRANSIT: 'bg-warning/20 text-[#8A6414]',
  STOK_BAIK: 'bg-primary/15 text-primary',
  STOK_RUSAK: 'bg-destructive/15 text-destructive',
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  STOK_MASUK: 'Stok Masuk',
  PINDAH_LOKASI_KELUAR: 'Pindah Lokasi (Keluar)',
  PINDAH_LOKASI_MASUK: 'Pindah Lokasi (Masuk)',
  PENYESUAIAN_TAMBAH: 'Penyesuaian (Tambah)',
  PENYESUAIAN_KURANG: 'Penyesuaian (Kurang)',
  PEMUSNAHAN_STOK: 'Pemusnahan Stok',
  PENGIRIMAN: 'Pengiriman',
  KOREKSI: 'Koreksi',
}

function formatQty(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

export default function StokPage() {
  const { user } = useAuth()
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])

  const [cooperativeId, setCooperativeId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [commodityId, setCommodityId] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<StockBalanceDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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

  // Gudang mengikuti koperasi yang dipilih.
  useEffect(() => {
    setWarehouses([])
    setWarehouseId('')
    setLocationId('')
    const params = new URLSearchParams({ limit: '100' })
    if (cooperativeId) params.set('cooperative_id', cooperativeId)
    apiFetch<Warehouse[]>(`/api/warehouses?${params.toString()}`).then((res) => {
      if (res.success && res.data) {
        setWarehouses(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [cooperativeId])

  // Lokasi mengikuti gudang yang dipilih.
  useEffect(() => {
    setLocations([])
    setLocationId('')
    if (!warehouseId) return
    apiFetch<WarehouseLocation[]>(
      `/api/warehouse-locations?warehouse_id=${warehouseId}&limit=100`
    ).then((res) => {
      if (res.success && res.data) {
        setLocations(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [warehouseId])

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (cooperativeId) params.set('cooperative_id', cooperativeId)
      if (warehouseId) params.set('warehouse_id', warehouseId)
      if (locationId) params.set('location_id', locationId)
      if (commodityId) params.set('commodity_id', commodityId)

      const res = await apiFetch<StockBalance[]>(`/api/stock-balances?${params.toString()}`)
      if (res.success && res.data) {
        setBalances(Array.isArray(res.data) ? res.data : [])
        setTotal(res.meta?.total || 0)
      }
    } catch {
      // ditangani oleh tampilan kosong
    } finally {
      setLoading(false)
    }
  }, [page, cooperativeId, warehouseId, locationId, commodityId])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const openDetail = async (item: StockBalance) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await apiFetch<StockBalanceDetail>(`/api/stock-balances/${item.id}`)
      if (res.success && res.data) {
        setDetail(res.data)
      }
    } finally {
      setDetailLoading(false)
    }
  }

  const columns: Column<StockBalance>[] = [
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'warehouse',
      label: 'Gudang',
      render: (item) => item.warehouse?.name || '-',
    },
    {
      key: 'location',
      label: 'Lokasi',
      render: (item) => (
        <div className="flex flex-col gap-1">
          <span>{item.location?.name || '-'}</span>
          {item.location?.location_type && (
            <Badge
              className={`w-fit text-xs ${
                LOCATION_TYPE_COLORS[item.location.location_type] ||
                'bg-muted text-muted-foreground'
              }`}
            >
              {LOCATION_TYPE_LABELS[item.location.location_type] ||
                item.location.location_type}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => (
        <div className="flex flex-col">
          <span>{item.commodity?.name || '-'}</span>
          {item.commodity_variant && (
            <span className="text-xs text-muted-foreground">
              {item.commodity_variant.name}
            </span>
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
      render: (item) =>
        item.batch_number ? (
          <span className="font-mono text-xs">{item.batch_number}</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'quantity',
      label: 'Jumlah',
      render: (item) => (
        <div className="text-right font-medium">
          {formatQty(item.quantity)} {item.unit}
        </div>
      ),
    },
  ]

  return (
    <DashboardShell
      title="Stok Saat Ini"
      description="Jumlah stok hasil tani yang tersimpan di setiap gudang dan lokasi."
      permission="stock.view"
    >
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Koperasi</Label>
          <Select
            value={cooperativeId || 'ALL'}
            onValueChange={(v) => {
              setPage(1)
              setCooperativeId(v === 'ALL' ? '' : (v ?? ''))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Koperasi">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Koperasi'
                  const item = cooperatives.find((c) => c.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Koperasi</SelectItem>
              {cooperatives.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Gudang</Label>
          <Select
            value={warehouseId || 'ALL'}
            onValueChange={(v) => {
              setPage(1)
              setWarehouseId(v === 'ALL' ? '' : (v ?? ''))
            }}
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
          <Label className="text-sm text-muted-foreground mb-1 block">Lokasi</Label>
          <Select
            value={locationId || 'ALL'}
            onValueChange={(v) => {
              setPage(1)
              setLocationId(v === 'ALL' ? '' : (v ?? ''))
            }}
          >
            <SelectTrigger disabled={!warehouseId}>
              <SelectValue placeholder="Semua Lokasi">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Lokasi'
                  const item = locations.find((l) => l.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Lokasi</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Komoditas</Label>
          <Select
            value={commodityId || 'ALL'}
            onValueChange={(v) => {
              setPage(1)
              setCommodityId(v === 'ALL' ? '' : (v ?? ''))
            }}
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
      </div>

      <DataTable
        columns={columns}
        data={balances}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada data stok."
        actions={(item) => (
          <Button variant="outline" size="sm" onClick={() => openDetail(item)}>
            <Eye className="h-4 w-4 mr-1" /> Detail
          </Button>
        )}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Stok</DialogTitle>
            <DialogDescription>
              Rincian saldo stok dan riwayat mutasi terakhir.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="text-sm text-muted-foreground py-4">Memuat detail stok...</p>
          )}

          {!detailLoading && detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Koperasi</p>
                  <p className="font-medium">{detail.cooperative?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gudang</p>
                  <p className="font-medium">{detail.warehouse?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lokasi</p>
                  <p className="font-medium">
                    {detail.location?.name || '-'}
                    {detail.location?.location_type && (
                      <Badge
                        className={`ml-2 text-xs ${
                          LOCATION_TYPE_COLORS[detail.location.location_type] ||
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {LOCATION_TYPE_LABELS[detail.location.location_type] ||
                          detail.location.location_type}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Komoditas</p>
                  <p className="font-medium">
                    {detail.commodity?.name || '-'}
                    {detail.commodity_variant && (
                      <span className="text-muted-foreground">
                        {' '}({detail.commodity_variant.name})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grade</p>
                  <p className="font-medium">
                    {detail.grade_name || detail.grade_code || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch</p>
                  <p className="font-medium font-mono text-xs">
                    {detail.batch_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jumlah Saat Ini</p>
                  <p className="font-semibold">
                    {formatQty(detail.quantity)} {detail.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Terakhir Diperbarui</p>
                  <p className="font-medium">{formatDateTime(detail.updated_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Riwayat Mutasi Terakhir</p>
                {detail.recent_movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat mutasi.
                  </p>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left">
                          <th className="px-3 py-2 font-medium">Tanggal</th>
                          <th className="px-3 py-2 font-medium">Tipe Mutasi</th>
                          <th className="px-3 py-2 font-medium text-right">Masuk</th>
                          <th className="px-3 py-2 font-medium text-right">Keluar</th>
                          <th className="px-3 py-2 font-medium text-right">
                            Saldo Sesudah
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.recent_movements.map((m) => (
                          <tr key={m.id} className="border-b last:border-b-0">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {formatDateTime(m.created_at)}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="secondary">
                                {MOVEMENT_TYPE_LABELS[m.movement_type] ||
                                  m.movement_type}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-primary">
                              {formatQty(m.quantity_in)}
                            </td>
                            <td className="px-3 py-2 text-right text-destructive">
                              {formatQty(m.quantity_out)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatQty(m.balance_after)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
