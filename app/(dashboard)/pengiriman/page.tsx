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
import { Plus, Eye, CheckCircle2, XCircle, Info, Truck } from 'lucide-react'
import { useAuth } from '@/components/layout/auth-provider'

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

interface CommodityVariant {
  id: string
  name: string
}

interface Commodity {
  id: string
  code: string
  name: string
  default_unit: string
  variants?: CommodityVariant[]
}

interface StockDelivery {
  id: string
  delivery_number: string
  quantity: string
  destination_type: string
  destination_name: string
  delivery_date: string
  grade_code?: string | null
  grade_name?: string | null
  batch_number?: string | null
  notes?: string | null
  status: string
  created_at: string
  cooperative?: Cooperative
  warehouse?: Warehouse
  location?: WarehouseLocation
  commodity?: Commodity
  commodity_variant?: CommodityVariant | null
  created_by?: { id: string; name: string } | null
}

interface StockBalance {
  id: string
  quantity: string
  unit: string
  grade_code?: string | null
  batch_number?: string | null
}

const DESTINATION_TYPE_LABELS: Record<string, string> = {
  PEMBELI: 'Pembeli',
  KOPERASI_LAIN: 'Koperasi Lain',
  GUDANG_LAIN: 'Gudang Lain',
  PROGRAM_PEMERINTAH: 'Program Pemerintah',
  LAINNYA: 'Lainnya',
}

const STATUS_OPTIONS = ['DIKIRIM', 'SELESAI', 'DIBATALKAN'] as const

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const INITIAL_FORM = {
  cooperative_id: '',
  warehouse_id: '',
  location_id: '',
  commodity_id: '',
  commodity_variant_id: '',
  grade_code: '',
  batch_number: '',
  quantity: '',
  destination_type: 'PEMBELI',
  destination_name: '',
  delivery_date: todayString(),
  notes: '',
}

export default function PengirimanPage() {
  const { user, hasPermission } = useAuth()

  const [data, setData] = useState<StockDelivery[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const [detailItem, setDetailItem] = useState<StockDelivery | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    item: StockDelivery
    type: 'complete' | 'cancel'
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [availableStock, setAvailableStock] = useState<{ quantity: number; unit: string } | null>(null)

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false
  const canCreate = hasPermission('stock_deliveries.create')
  const canComplete = hasPermission('stock_deliveries.complete')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (statusFilter) params.set('status', statusFilter)
    if (destinationFilter) params.set('destination_type', destinationFilter)
    const res = await apiFetch<StockDelivery[]>(`/api/stock-deliveries?${params.toString()}`)
    if (res.success && res.data) {
      setData(res.data)
      setTotal(res.meta?.total || 0)
    }
    setLoading(false)
  }, [page, statusFilter, destinationFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Koperasi options for the create form
  useEffect(() => {
    if (isGlobal) {
      apiFetch<Cooperative[]>('/api/cooperatives').then((res) => {
        if (res.success && res.data) setCooperatives(res.data)
      })
    } else {
      setCooperatives(accessibleCoops)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobal, user])

  // Cascading: koperasi -> gudang
  useEffect(() => {
    if (!formData.cooperative_id) {
      setWarehouses([])
      return
    }
    apiFetch<Warehouse[]>(`/api/warehouses?cooperative_id=${formData.cooperative_id}&limit=100`)
      .then((res) => {
        if (res.success && res.data) setWarehouses(res.data)
      })
  }, [formData.cooperative_id])

  // Cascading: gudang -> lokasi
  useEffect(() => {
    if (!formData.warehouse_id) {
      setLocations([])
      return
    }
    apiFetch<WarehouseLocation[]>(`/api/warehouse-locations?warehouse_id=${formData.warehouse_id}&limit=100`)
      .then((res) => {
        if (res.success && res.data) setLocations(res.data)
      })
  }, [formData.warehouse_id])

  // Komoditas
  useEffect(() => {
    apiFetch<Commodity[]>('/api/commodities?limit=100').then((res) => {
      if (res.success && res.data) setCommodities(res.data)
    })
  }, [])

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
    if (formData.commodity_variant_id) {
      params.set('commodity_variant_id', formData.commodity_variant_id)
    }
    apiFetch<StockBalance[]>(`/api/stock-balances?${params.toString()}`).then((res) => {
      if (res.success && res.data) {
        let balances = res.data
        if (formData.grade_code.trim()) {
          balances = balances.filter(
            (b) => (b.grade_code || '').toUpperCase() === formData.grade_code.trim().toUpperCase()
          )
        }
        if (formData.batch_number.trim()) {
          balances = balances.filter((b) => (b.batch_number || '') === formData.batch_number.trim())
        }
        const totalQty = balances.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
        const unit = balances[0]?.unit
          || commodities.find((c) => c.id === formData.commodity_id)?.default_unit
          || ''
        setAvailableStock({ quantity: totalQty, unit })
      } else {
        setAvailableStock(null)
      }
    })
  }, [
    formData.location_id,
    formData.commodity_id,
    formData.commodity_variant_id,
    formData.grade_code,
    formData.batch_number,
    commodities,
  ])

  // Auto-select koperasi jika hanya satu
  useEffect(() => {
    if (dialogOpen && !formData.cooperative_id && cooperatives.length === 1) {
      setFormData((prev) => ({ ...prev, cooperative_id: cooperatives[0].id }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, cooperatives])

  const openCreate = () => {
    setFormData({ ...INITIAL_FORM, delivery_date: todayString() })
    setDialogOpen(true)
  }

  const selectedCommodity = commodities.find((c) => c.id === formData.commodity_id)
  const variants = selectedCommodity?.variants || []

  const handleSubmit = async () => {
    if (!formData.warehouse_id || !formData.location_id || !formData.commodity_id) {
      toast.error('Lengkapi pilihan gudang, lokasi, dan komoditas terlebih dahulu.')
      return
    }
    const qty = Number(formData.quantity)
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      toast.error('Jumlah dikirim harus lebih besar dari 0.')
      return
    }
    if (!formData.destination_name.trim()) {
      toast.error('Nama tujuan / penerima wajib diisi.')
      return
    }
    setSaving(true)
    const res = await apiFetch('/api/stock-deliveries', {
      method: 'POST',
      body: {
        warehouse_id: formData.warehouse_id,
        location_id: formData.location_id,
        commodity_id: formData.commodity_id,
        commodity_variant_id: formData.commodity_variant_id || null,
        grade_code: formData.grade_code.trim() || null,
        batch_number: formData.batch_number.trim() || null,
        quantity: qty,
        destination_type: formData.destination_type,
        destination_name: formData.destination_name.trim(),
        delivery_date: formData.delivery_date || undefined,
        notes: formData.notes || undefined,
      },
    })
    if (res.success) {
      toast.success('Pengiriman berhasil dicatat.')
      setDialogOpen(false)
      setFormData(INITIAL_FORM)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan saat menyimpan pengiriman.')
    }
    setSaving(false)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setProcessing(true)
    const { item, type } = confirmAction
    const res = await apiFetch(`/api/stock-deliveries/${item.id}/${type}`, { method: 'POST' })
    if (res.success) {
      toast.success(
        type === 'complete'
          ? 'Pengiriman berhasil diselesaikan. Stok telah dikurangi.'
          : 'Pengiriman berhasil dibatalkan.'
      )
      setConfirmAction(null)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan saat memproses pengiriman.')
    }
    setProcessing(false)
  }

  const columns: Column<StockDelivery>[] = [
    {
      key: 'delivery_number',
      label: 'Nomor Pengiriman',
      render: (item) => <span className="font-medium">{item.delivery_number}</span>,
    },
    {
      key: 'delivery_date',
      label: 'Tanggal Kirim',
      render: (item) => formatDate(item.delivery_date),
    },
    {
      key: 'destination_name',
      label: 'Tujuan',
      render: (item) => (
        <div>
          <p>{item.destination_name}</p>
          <p className="text-xs text-muted-foreground">
            {DESTINATION_TYPE_LABELS[item.destination_type] || item.destination_type}
          </p>
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: 'Gudang / Lokasi Asal',
      render: (item) => (
        <div>
          <p>{item.warehouse?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.location?.name || '-'}</p>
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
      key: 'grade_code',
      label: 'Grade',
      render: (item) => item.grade_name || item.grade_code || '-',
    },
    {
      key: 'quantity',
      label: 'Jumlah',
      render: (item) => (
        <span>
          {Number(item.quantity).toLocaleString('id-ID')} {item.commodity?.default_unit || ''}
        </span>
      ),
    },
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
      title="Pengiriman"
      description="Catat barang keluar dari koperasi, misalnya ke pembeli, koperasi lain, atau program tertentu."
      permission="stock_deliveries.view"
    >
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          Pengiriman digunakan untuk mencatat barang keluar dari koperasi, misalnya ke pembeli,
          koperasi lain, atau program tertentu.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Label className="mb-1 block text-xs text-muted-foreground">Status</Label>
            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : (v ?? '')); setPage(1) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Status">
                  {(v: string | null) =>
                    !v || v === 'ALL' ? 'Semua Status' : (STATUS_LABELS[v] || v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <Label className="mb-1 block text-xs text-muted-foreground">Tipe Tujuan</Label>
            <Select
              value={destinationFilter || 'ALL'}
              onValueChange={(v) => { setDestinationFilter(v === 'ALL' ? '' : (v ?? '')); setPage(1) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Tujuan">
                  {(v: string | null) =>
                    !v || v === 'ALL' ? 'Semua Tujuan' : (DESTINATION_TYPE_LABELS[v] || v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tujuan</SelectItem>
                {Object.entries(DESTINATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Catat Pengiriman
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
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada data pengiriman."
        actions={(item) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)} title="Detail">
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === 'DIKIRIM' && canComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction({ item, type: 'complete' })}
                title="Selesaikan"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </Button>
            )}
            {item.status === 'DIKIRIM' && canCreate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction({ item, type: 'cancel' })}
                title="Batalkan"
              >
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      />

      {/* Dialog Catat Pengiriman */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Pengiriman</DialogTitle>
            <DialogDescription>
              Catat barang yang keluar dari gudang koperasi ke tujuan tertentu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cooperative_id">Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    cooperative_id: v ?? '',
                    warehouse_id: '',
                    location_id: '',
                  })
                }
              >
                <SelectTrigger id="cooperative_id">
                  <SelectValue placeholder="Pilih koperasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih koperasi'
                      const item = cooperatives.find((c) => c.id === v)
                      return item ? `${item.code} - ${item.name}` : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warehouse_id">Gudang Asal</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, warehouse_id: v ?? '', location_id: '' })
                }
              >
                <SelectTrigger id="warehouse_id">
                  <SelectValue placeholder="Pilih gudang">
                    {(v: string | null) => {
                      if (!v) return 'Pilih gudang'
                      const item = warehouses.find((w) => w.id === v)
                      return item ? `${item.code} - ${item.name}` : v
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
              <Label htmlFor="location_id">Lokasi Asal</Label>
              <Select
                value={formData.location_id}
                onValueChange={(v) => setFormData({ ...formData, location_id: v ?? '' })}
              >
                <SelectTrigger id="location_id">
                  <SelectValue placeholder="Pilih lokasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih lokasi'
                      const item = locations.find((l) => l.id === v)
                      return item ? `${item.code} - ${item.name}` : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commodity_id">Komoditas</Label>
              <Select
                value={formData.commodity_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, commodity_id: v ?? '', commodity_variant_id: '' })
                }
              >
                <SelectTrigger id="commodity_id">
                  <SelectValue placeholder="Pilih komoditas">
                    {(v: string | null) => {
                      if (!v) return 'Pilih komoditas'
                      const item = commodities.find((c) => c.id === v)
                      return item ? item.name : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {commodities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {variants.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="commodity_variant_id">Varian (Opsional)</Label>
                <Select
                  value={formData.commodity_variant_id || 'NONE'}
                  onValueChange={(v) =>
                    setFormData({ ...formData, commodity_variant_id: v === 'NONE' ? '' : (v ?? '') })
                  }
                >
                  <SelectTrigger id="commodity_variant_id">
                    <SelectValue placeholder="Tanpa varian">
                      {(v: string | null) => {
                        if (!v || v === 'NONE') return 'Tanpa varian'
                        const item = variants.find((vr) => vr.id === v)
                        return item ? item.name : v
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Tanpa varian</SelectItem>
                    {variants.map((vr) => (
                      <SelectItem key={vr.id} value={vr.id}>
                        {vr.name}
                      </SelectItem>
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
                  placeholder="Contoh: A / B / C"
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

            {availableStock && (
              <p className="text-xs text-muted-foreground">
                Stok tersedia:{' '}
                <span className="font-medium text-foreground">
                  {availableStock.quantity.toLocaleString('id-ID')} {availableStock.unit}
                </span>
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="quantity">Jumlah Dikirim</Label>
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
              <Label htmlFor="destination_type">Tipe Tujuan</Label>
              <Select
                value={formData.destination_type}
                onValueChange={(v) => setFormData({ ...formData, destination_type: v ?? 'PEMBELI' })}
              >
                <SelectTrigger id="destination_type">
                  <SelectValue>
                    {(v: string | null) => (v ? DESTINATION_TYPE_LABELS[v] || v : 'Pilih tipe tujuan')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DESTINATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination_name">Nama Tujuan / Penerima</Label>
              <Input
                id="destination_name"
                value={formData.destination_name}
                onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                placeholder="Contoh: PT Beras Sejahtera"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery_date">Tanggal Pengiriman</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan"
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
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Detail Pengiriman
            </DialogTitle>
            <DialogDescription>{detailItem?.delivery_number}</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={STATUS_COLORS[detailItem.status] || ''}>
                  {STATUS_LABELS[detailItem.status] || detailItem.status}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tanggal Kirim</span>
                <span>{formatDate(detailItem.delivery_date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tujuan</span>
                <span className="text-right">
                  {detailItem.destination_name}
                  <span className="block text-xs text-muted-foreground">
                    {DESTINATION_TYPE_LABELS[detailItem.destination_type] || detailItem.destination_type}
                  </span>
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Koperasi</span>
                <span>{detailItem.cooperative?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Gudang / Lokasi Asal</span>
                <span className="text-right">
                  {detailItem.warehouse?.name || '-'}
                  <span className="block text-xs text-muted-foreground">
                    {detailItem.location?.name || '-'}
                  </span>
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
                <span>{detailItem.grade_name || detailItem.grade_code || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Batch</span>
                <span>{detailItem.batch_number || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-medium">
                  {Number(detailItem.quantity).toLocaleString('id-ID')}{' '}
                  {detailItem.commodity?.default_unit || ''}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Catatan</span>
                <span className="text-right">{detailItem.notes || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dibuat Oleh</span>
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

      {/* Dialog Konfirmasi Selesaikan / Batalkan */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'complete' ? 'Selesaikan Pengiriman' : 'Batalkan Pengiriman'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'complete'
                ? `Pengiriman ${confirmAction?.item.delivery_number} akan diselesaikan dan stok akan dikurangi dari lokasi asal. Lanjutkan?`
                : `Pengiriman ${confirmAction?.item.delivery_number} akan dibatalkan dan tidak dapat diproses lagi. Lanjutkan?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Batal</Button>
            <Button
              variant={confirmAction?.type === 'cancel' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={processing}
            >
              {processing
                ? 'Memproses...'
                : confirmAction?.type === 'complete'
                  ? 'Ya, Selesaikan'
                  : 'Ya, Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
