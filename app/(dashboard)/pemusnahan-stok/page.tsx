'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDate, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Eye, CheckCircle2, XCircle, Info } from 'lucide-react'
import { useAuth } from '@/components/layout/auth-provider'

interface EntityRef {
  id: string
  code?: string
  name: string
}

interface LocationRef extends EntityRef {
  location_type?: string
}

interface CommodityRef extends EntityRef {
  default_unit?: string
}

interface StockDisposal {
  id: string
  disposal_number: string
  quantity: string
  reason: string
  notes?: string
  status: string
  disposal_date: string
  created_at: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  warehouse?: EntityRef
  location?: LocationRef
  commodity?: CommodityRef
  commodity_variant?: { id: string; name: string }
  cooperative?: EntityRef
  created_by?: { id: string; name: string }
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

interface CommodityVariant {
  id: string
  name: string
}

interface Commodity {
  id: string
  code: string
  name: string
  default_unit?: string
  variants?: CommodityVariant[]
}

interface StockBalance {
  id: string
  quantity: string
  unit?: string
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  TRANSIT: 'Transit',
  STOK_BAIK: 'Stok Baik',
  STOK_RUSAK: 'Stok Rusak',
  PENGIRIMAN: 'Pengiriman',
  PENYESUAIAN: 'Penyesuaian',
  LAINNYA: 'Lainnya',
}

const REASON_OPTIONS = [
  'Busuk',
  'Rusak',
  'Tidak Layak Jual',
  'Kedaluwarsa',
  'Tercampur Kotoran',
  'Lainnya',
]

const STATUS_OPTIONS = [
  { value: 'DIKIRIM', label: 'Dikirim' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
]

const todayStr = () => new Date().toISOString().slice(0, 10)

const INITIAL_FORM = {
  cooperative_id: '',
  warehouse_id: '',
  location_id: '',
  commodity_id: '',
  commodity_variant_id: '',
  grade_code: '',
  batch_number: '',
  quantity: '',
  reason: '',
  disposal_date: todayStr(),
  notes: '',
}

export default function PemusnahanStokPage() {
  const { user, hasPermission } = useAuth()

  const [data, setData] = useState<StockDisposal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<StockDisposal | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [cooperatives, setCooperatives] = useState<EntityRef[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [availableStock, setAvailableStock] = useState<string | null>(null)

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false
  const canApprove = hasPermission('stock_disposals.approve')
  const canCreate = hasPermission('stock_disposals.create')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await apiFetch<StockDisposal[]>(`/api/stock-disposals?${params.toString()}`)
    if (res.success && res.data) {
      setData(res.data)
      setTotal(res.meta?.total || 0)
    }
    setLoading(false)
  }, [page, statusFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  // Koperasi options
  useEffect(() => {
    if (isGlobal) {
      apiFetch<EntityRef[]>('/api/cooperatives').then((res) => {
        if (res.success && res.data) setCooperatives(Array.isArray(res.data) ? res.data : [])
      })
    } else {
      setCooperatives(accessibleCoops)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobal, user])

  // Komoditas options
  useEffect(() => {
    apiFetch<Commodity[]>('/api/commodities').then((res) => {
      if (res.success && res.data) setCommodities(Array.isArray(res.data) ? res.data : [])
    })
  }, [])

  // Gudang cascade
  useEffect(() => {
    if (!formData.cooperative_id) {
      setWarehouses([])
      return
    }
    apiFetch<Warehouse[]>(`/api/warehouses?cooperative_id=${formData.cooperative_id}&limit=100`).then((res) => {
      if (res.success && res.data) {
        setWarehouses(res.data)
        if (res.data.length === 1) {
          setFormData((prev) => prev.warehouse_id ? prev : { ...prev, warehouse_id: res.data![0].id })
        }
      }
    })
  }, [formData.cooperative_id])

  // Lokasi cascade — arahkan pengguna ke lokasi Stok Rusak (tanpa paksaan)
  useEffect(() => {
    if (!formData.warehouse_id) {
      setLocations([])
      return
    }
    apiFetch<WarehouseLocation[]>(`/api/warehouse-locations?warehouse_id=${formData.warehouse_id}&limit=100`).then((res) => {
      if (res.success && res.data) {
        setLocations(res.data)
        const rusak = res.data.find((l) => l.location_type === 'STOK_RUSAK')
        if (rusak) {
          setFormData((prev) => prev.location_id ? prev : { ...prev, location_id: rusak.id })
        }
      }
    })
  }, [formData.warehouse_id])

  // Stok tersedia hint
  useEffect(() => {
    if (!formData.location_id || !formData.commodity_id) {
      setAvailableStock(null)
      return
    }
    const params = new URLSearchParams()
    params.set('location_id', formData.location_id)
    params.set('commodity_id', formData.commodity_id)
    params.set('limit', '100')
    if (formData.commodity_variant_id) params.set('commodity_variant_id', formData.commodity_variant_id)
    if (formData.grade_code) params.set('grade_code', formData.grade_code)
    if (formData.batch_number) params.set('batch_number', formData.batch_number)
    apiFetch<StockBalance[]>(`/api/stock-balances?${params.toString()}`).then((res) => {
      if (res.success && res.data) {
        const sum = res.data.reduce((acc, b) => acc + (parseFloat(b.quantity) || 0), 0)
        const commodity = commodities.find((c) => c.id === formData.commodity_id)
        const unit = res.data[0]?.unit || commodity?.default_unit || ''
        setAvailableStock(`${sum.toLocaleString('id-ID')} ${unit}`.trim())
      } else {
        setAvailableStock(null)
      }
    })
  }, [formData.location_id, formData.commodity_id, formData.commodity_variant_id, formData.grade_code, formData.batch_number, commodities])

  const selectedCommodity = commodities.find((c) => c.id === formData.commodity_id)
  const variants = selectedCommodity?.variants || []

  const openCreate = () => {
    setFormData({
      ...INITIAL_FORM,
      disposal_date: todayStr(),
      cooperative_id: !isGlobal && accessibleCoops.length === 1 ? accessibleCoops[0].id : '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.cooperative_id) return toast.error('Silakan pilih koperasi terlebih dahulu.')
    if (!formData.warehouse_id) return toast.error('Silakan pilih gudang.')
    if (!formData.location_id) return toast.error('Silakan pilih lokasi.')
    if (!formData.commodity_id) return toast.error('Silakan pilih komoditas.')
    const qty = parseFloat(formData.quantity)
    if (!qty || qty <= 0) return toast.error('Jumlah dimusnahkan harus lebih besar dari 0.')
    if (!formData.reason) return toast.error('Silakan pilih alasan pemusnahan.')
    if (!formData.disposal_date) return toast.error('Silakan isi tanggal pemusnahan.')

    setSaving(true)
    const res = await apiFetch('/api/stock-disposals', {
      method: 'POST',
      body: {
        warehouse_id: formData.warehouse_id,
        location_id: formData.location_id,
        commodity_id: formData.commodity_id,
        commodity_variant_id: formData.commodity_variant_id || null,
        grade_code: formData.grade_code || null,
        batch_number: formData.batch_number || null,
        quantity: qty,
        reason: formData.reason,
        disposal_date: formData.disposal_date,
        notes: formData.notes || undefined,
      },
    })
    if (res.success) {
      toast.success(
        canApprove
          ? 'Pemusnahan stok berhasil dicatat dan stok telah dikurangi.'
          : 'Pemusnahan stok berhasil dikirim dan menunggu penyelesaian.'
      )
      setDialogOpen(false)
      setFormData(INITIAL_FORM)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan saat menyimpan pemusnahan.')
    }
    setSaving(false)
  }

  const handleComplete = async (item: StockDisposal) => {
    if (!confirm(`Selesaikan pemusnahan ${item.disposal_number}? Stok akan dikurangi dari lokasi terkait.`)) return
    setProcessingId(item.id)
    const res = await apiFetch(`/api/stock-disposals/${item.id}/complete`, { method: 'POST' })
    if (res.success) {
      toast.success('Pemusnahan stok berhasil diselesaikan.')
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal menyelesaikan pemusnahan.')
    }
    setProcessingId(null)
  }

  const handleCancel = async (item: StockDisposal) => {
    if (!confirm(`Batalkan pemusnahan ${item.disposal_number}?`)) return
    setProcessingId(item.id)
    const res = await apiFetch(`/api/stock-disposals/${item.id}/cancel`, { method: 'POST' })
    if (res.success) {
      toast.success('Pemusnahan stok berhasil dibatalkan.')
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal membatalkan pemusnahan.')
    }
    setProcessingId(null)
  }

  const gradeLabel = (item: StockDisposal) => item.grade_name || item.grade_code || '-'

  const columns: Column<StockDisposal>[] = [
    {
      key: 'disposal_number',
      label: 'Nomor Pemusnahan',
      render: (item) => <span className="font-medium">{item.disposal_number}</span>,
    },
    {
      key: 'disposal_date',
      label: 'Tanggal Pemusnahan',
      render: (item) => formatDate(item.disposal_date),
    },
    {
      key: 'warehouse',
      label: 'Gudang / Lokasi',
      render: (item) => (
        <div>
          <p>{item.warehouse?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">
            {item.location?.name || '-'}
            {item.location?.location_type ? ` (${LOCATION_TYPE_LABELS[item.location.location_type] || item.location.location_type})` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => (
        <div>
          <p>{item.commodity?.name || '-'}</p>
          {item.commodity_variant && (
            <p className="text-xs text-muted-foreground">{item.commodity_variant.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (item) => gradeLabel(item),
    },
    {
      key: 'quantity',
      label: 'Jumlah',
      render: (item) => (
        <span>
          {(parseFloat(item.quantity) || 0).toLocaleString('id-ID')} {item.commodity?.default_unit || ''}
        </span>
      ),
    },
    { key: 'reason', label: 'Alasan' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge className={STATUS_COLORS[item.status] || ''}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      ),
    },
  ]

  return (
    <DashboardShell
      title="Pemusnahan Stok"
      description="Catat barang rusak, busuk, atau tidak layak jual yang dikeluarkan dari persediaan."
      permission="stock_disposals.view"
    >
      <div className="mb-4 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Pemusnahan stok digunakan untuk mencatat barang rusak, busuk, atau tidak layak jual
          yang dikeluarkan dari persediaan.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Status</Label>
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={(v) => {
              setPage(1)
              setStatusFilter(v === 'ALL' ? '' : (v ?? ''))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Status">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Status'
                  return STATUS_OPTIONS.find((s) => s.value === v)?.label || v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Catat Pemusnahan
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        searchPlaceholder="Cari nomor pemusnahan..."
        onSearch={(q) => { setPage(1); setSearch(q) }}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada data pemusnahan stok."
        actions={(item) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)} title="Detail">
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === 'DIKIRIM' && canApprove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleComplete(item)}
                disabled={processingId === item.id}
                title="Selesaikan"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="sr-only">Selesaikan</span>
              </Button>
            )}
            {item.status === 'DIKIRIM' && canCreate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(item)}
                disabled={processingId === item.id}
                title="Batalkan"
              >
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="sr-only">Batalkan</span>
              </Button>
            )}
          </div>
        )}
      />

      {/* Dialog Catat Pemusnahan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Pemusnahan</DialogTitle>
            <DialogDescription>
              Catat barang yang dimusnahkan dari persediaan. Disarankan memilih lokasi Stok Rusak.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) => setFormData({
                  ...formData,
                  cooperative_id: v ?? '',
                  warehouse_id: '',
                  location_id: '',
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih koperasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih koperasi'
                      const c = cooperatives.find((x) => x.id === v)
                      return c ? (c.code ? `${c.code} - ${c.name}` : c.name) : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code ? `${c.code} - ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Gudang</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(v) => setFormData({ ...formData, warehouse_id: v ?? '', location_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gudang">
                    {(v: string | null) => {
                      if (!v) return 'Pilih gudang'
                      const w = warehouses.find((x) => x.id === v)
                      return w ? `${w.code} - ${w.name}` : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Lokasi</Label>
              <Select
                value={formData.location_id}
                onValueChange={(v) => setFormData({ ...formData, location_id: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih lokasi'
                      const l = locations.find((x) => x.id === v)
                      return l
                        ? `${l.name} (${LOCATION_TYPE_LABELS[l.location_type] || l.location_type})`
                        : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({LOCATION_TYPE_LABELS[l.location_type] || l.location_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Disarankan memilih lokasi Stok Rusak untuk pemusnahan.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Komoditas</Label>
              <Select
                value={formData.commodity_id}
                onValueChange={(v) => setFormData({ ...formData, commodity_id: v ?? '', commodity_variant_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih komoditas">
                    {(v: string | null) => {
                      if (!v) return 'Pilih komoditas'
                      const c = commodities.find((x) => x.id === v)
                      return c ? c.name : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {commodities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {variants.length > 0 && (
              <div className="grid gap-2">
                <Label>Varian (Opsional)</Label>
                <Select
                  value={formData.commodity_variant_id || 'NONE'}
                  onValueChange={(v) => setFormData({ ...formData, commodity_variant_id: v === 'NONE' ? '' : (v ?? '') })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanpa varian">
                      {(v: string | null) => {
                        if (!v || v === 'NONE') return 'Tanpa varian'
                        const vr = variants.find((x) => x.id === v)
                        return vr ? vr.name : v
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Tanpa varian</SelectItem>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="grade_code">Grade (Opsional)</Label>
                <Input
                  id="grade_code"
                  value={formData.grade_code}
                  onChange={(e) => setFormData({ ...formData, grade_code: e.target.value })}
                  placeholder="Contoh: A / B / REJECT"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batch_number">Batch (Opsional)</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="Nomor batch"
                />
              </div>
            </div>

            {availableStock !== null && (
              <p className="text-xs text-muted-foreground -mt-2">
                Stok tersedia: <strong>{availableStock}</strong>
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="quantity">Jumlah Dimusnahkan</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label>Alasan Pemusnahan</Label>
              <Select
                value={formData.reason}
                onValueChange={(v) => setFormData({ ...formData, reason: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="disposal_date">Tanggal Pemusnahan</Label>
              <Input
                id="disposal_date"
                type="date"
                value={formData.disposal_date}
                onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detail */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pemusnahan</DialogTitle>
            <DialogDescription>{detailItem?.disposal_number}</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <Badge className={STATUS_COLORS[detailItem.status] || ''}>
                  {STATUS_LABELS[detailItem.status] || detailItem.status}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tanggal Pemusnahan</span>
                <span>{formatDate(detailItem.disposal_date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Koperasi</span>
                <span>{detailItem.cooperative?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Gudang</span>
                <span>{detailItem.warehouse?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Lokasi</span>
                <span>
                  {detailItem.location?.name || '-'}
                  {detailItem.location?.location_type
                    ? ` (${LOCATION_TYPE_LABELS[detailItem.location.location_type] || detailItem.location.location_type})`
                    : ''}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Komoditas</span>
                <span>
                  {detailItem.commodity?.name || '-'}
                  {detailItem.commodity_variant ? ` - ${detailItem.commodity_variant.name}` : ''}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Grade</span>
                <span>{gradeLabel(detailItem)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Batch</span>
                <span>{detailItem.batch_number || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-medium">
                  {(parseFloat(detailItem.quantity) || 0).toLocaleString('id-ID')} {detailItem.commodity?.default_unit || ''}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Alasan</span>
                <span>{detailItem.reason}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Catatan</span>
                <span className="text-right">{detailItem.notes || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dicatat Oleh</span>
                <span>{detailItem.created_by?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dibuat Pada</span>
                <span>{formatDateTime(detailItem.created_at)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
