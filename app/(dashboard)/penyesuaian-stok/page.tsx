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
import { Plus, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/components/layout/auth-provider'

interface StockAdjustment {
  id: string
  adjustment_number: string
  adjustment_type: 'TAMBAH' | 'KURANG'
  quantity: string
  reason: string
  notes?: string | null
  grade_code?: string | null
  grade_name?: string | null
  batch_number?: string | null
  status: string
  created_at: string
  warehouse?: { id: string; code: string; name: string }
  location?: { id: string; code: string; name: string; location_type: string }
  commodity?: { id: string; code: string; name: string; default_unit: string }
  commodity_variant?: { id: string; name: string } | null
  created_by?: { id: string; name: string } | null
  cooperative?: { id: string; code: string; name: string }
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

interface StockBalance {
  id: string
  quantity: string
  unit: string
}

const TYPE_LABELS: Record<string, string> = {
  TAMBAH: 'Tambah',
  KURANG: 'Kurang',
}

const TYPE_COLORS: Record<string, string> = {
  TAMBAH: 'bg-primary/15 text-primary',
  KURANG: 'bg-orange/15 text-[#A05E12]',
}

const REASON_OPTIONS = [
  'Timbangan Ulang',
  'Susut Berat',
  'Kesalahan Input',
  'Barang Rusak',
  'Selisih Stok Opname',
  'Lainnya',
]

const INITIAL_FORM = {
  cooperative_id: '',
  warehouse_id: '',
  location_id: '',
  commodity_id: '',
  commodity_variant_id: '',
  grade_code: '',
  batch_number: '',
  adjustment_type: 'TAMBAH',
  quantity: '',
  reason: '',
  notes: '',
}

export default function PenyesuaianStokPage() {
  const { user } = useAuth()
  const [data, setData] = useState<StockAdjustment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<StockAdjustment | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [availableStock, setAvailableStock] = useState<number | null>(null)

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false
  const canCreate = user?.permissions?.includes('stock_adjustments.create') || false
  const canApprove = user?.permissions?.includes('stock_adjustments.approve') || false

  const coopOptions = isGlobal
    ? cooperatives
    : cooperatives.filter((c) => accessibleCoops.some((a) => a.id === c.id))

  const selectedCommodity = commodities.find((c) => c.id === formData.commodity_id)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('adjustment_type', typeFilter)
    const res = await apiFetch<StockAdjustment[]>(`/api/stock-adjustments?${params.toString()}`)
    if (res.success) {
      setData(res.data || [])
      setTotal(res.meta?.total || 0)
    }
    setLoading(false)
  }, [page, statusFilter, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    apiFetch<Cooperative[]>('/api/cooperatives').then((res) => {
      if (res.success && res.data) setCooperatives(Array.isArray(res.data) ? res.data : [])
    })
    apiFetch<Commodity[]>('/api/commodities').then((res) => {
      if (res.success && res.data) setCommodities(Array.isArray(res.data) ? res.data : [])
    })
  }, [])

  // Cascading: koperasi -> gudang
  useEffect(() => {
    if (!formData.cooperative_id) {
      setWarehouses([])
      return
    }
    apiFetch<Warehouse[]>(`/api/warehouses?cooperative_id=${formData.cooperative_id}&limit=100`)
      .then((res) => {
        if (res.success && res.data) setWarehouses(Array.isArray(res.data) ? res.data : [])
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
        if (res.success && res.data) setLocations(Array.isArray(res.data) ? res.data : [])
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
    if (formData.commodity_variant_id) params.set('commodity_variant_id', formData.commodity_variant_id)
    if (formData.grade_code) params.set('grade_code', formData.grade_code)
    if (formData.batch_number) params.set('batch_number', formData.batch_number)
    apiFetch<StockBalance[]>(`/api/stock-balances?${params.toString()}`).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const sum = res.data.reduce((acc, b) => acc + Number(b.quantity || 0), 0)
        setAvailableStock(sum)
      } else {
        setAvailableStock(null)
      }
    })
  }, [formData.location_id, formData.commodity_id, formData.commodity_variant_id, formData.grade_code, formData.batch_number])

  const openCreate = () => {
    const initial = { ...INITIAL_FORM }
    if (!isGlobal && accessibleCoops.length === 1) {
      initial.cooperative_id = accessibleCoops[0].id
    }
    setFormData(initial)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.warehouse_id || !formData.location_id || !formData.commodity_id) {
      toast.error('Pilih gudang, lokasi, dan komoditas terlebih dahulu.')
      return
    }
    const qty = parseFloat(formData.quantity)
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      toast.error('Jumlah harus lebih besar dari 0.')
      return
    }
    if (!formData.reason) {
      toast.error('Pilih alasan penyesuaian.')
      return
    }
    setSaving(true)
    const res = await apiFetch('/api/stock-adjustments', {
      method: 'POST',
      body: {
        warehouse_id: formData.warehouse_id,
        location_id: formData.location_id,
        commodity_id: formData.commodity_id,
        commodity_variant_id: formData.commodity_variant_id || null,
        grade_code: formData.grade_code || null,
        batch_number: formData.batch_number || null,
        adjustment_type: formData.adjustment_type,
        quantity: qty,
        reason: formData.reason,
        notes: formData.notes || undefined,
      },
    })
    if (res.success) {
      toast.success('Penyesuaian stok berhasil dicatat.')
      setDialogOpen(false)
      setFormData(INITIAL_FORM)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan saat menyimpan penyesuaian.')
    }
    setSaving(false)
  }

  const handleApprove = async (item: StockAdjustment) => {
    setProcessingId(item.id)
    const res = await apiFetch(`/api/stock-adjustments/${item.id}/approve`, { method: 'POST' })
    if (res.success) {
      toast.success(`Penyesuaian ${item.adjustment_number} disetujui.`)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal menyetujui penyesuaian.')
    }
    setProcessingId(null)
  }

  const handleCancel = async (item: StockAdjustment) => {
    if (!confirm(`Batalkan penyesuaian ${item.adjustment_number}?`)) return
    setProcessingId(item.id)
    const res = await apiFetch(`/api/stock-adjustments/${item.id}/cancel`, { method: 'POST' })
    if (res.success) {
      toast.success(`Penyesuaian ${item.adjustment_number} dibatalkan.`)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal membatalkan penyesuaian.')
    }
    setProcessingId(null)
  }

  const columns: Column<StockAdjustment>[] = [
    {
      key: 'adjustment_number',
      label: 'Nomor Penyesuaian',
      render: (item) => <span className="font-mono text-xs">{item.adjustment_number}</span>,
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDate(item.created_at),
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
          <p>{item.commodity?.name || '-'}</p>
          {item.commodity_variant && (
            <p className="text-xs text-muted-foreground">{item.commodity_variant.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'adjustment_type',
      label: 'Tipe',
      render: (item) => (
        <Badge className={TYPE_COLORS[item.adjustment_type] || ''}>
          {TYPE_LABELS[item.adjustment_type] || item.adjustment_type}
        </Badge>
      ),
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
      key: 'reason',
      label: 'Alasan',
      render: (item) => (
        <span className="block max-w-[160px] truncate" title={item.reason}>
          {item.reason}
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
      title="Penyesuaian Stok"
      description="Catat perbedaan jumlah fisik barang dengan catatan sistem."
      permission="stock_adjustments.view"
    >
      <div className="bg-brand-light text-sm rounded-lg p-3 mb-4">
        Gunakan penyesuaian stok jika jumlah fisik barang berbeda dengan catatan sistem,
        misalnya karena timbangan ulang, susut berat, atau selisih stok opname.
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-44">
          <Label className="text-sm text-muted-foreground mb-1 block">Status</Label>
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : (v ?? '')); setPage(1) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Status">
                {(v: string | null) => (!v || v === 'ALL' ? 'Semua Status' : STATUS_LABELS[v] || v)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DIKIRIM">Dikirim</SelectItem>
              <SelectItem value="DISETUJUI">Disetujui</SelectItem>
              <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Label className="text-sm text-muted-foreground mb-1 block">Tipe Penyesuaian</Label>
          <Select
            value={typeFilter || 'ALL'}
            onValueChange={(v) => { setTypeFilter(v === 'ALL' ? '' : (v ?? '')); setPage(1) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Tipe'
                  return v === 'TAMBAH' ? 'Tambah Stok' : 'Kurangi Stok'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="TAMBAH">Tambah Stok</SelectItem>
              <SelectItem value="KURANG">Kurangi Stok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <div className="ml-auto">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Penyesuaian
            </Button>
          </div>
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
        emptyMessage="Belum ada data penyesuaian stok."
        actions={(item) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)} title="Detail">
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === 'DIKIRIM' && canApprove && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                disabled={processingId === item.id}
                onClick={() => handleApprove(item)}
                title="Setujui"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
              </Button>
            )}
            {item.status === 'DIKIRIM' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={processingId === item.id}
                onClick={() => handleCancel(item)}
                title="Batalkan"
              >
                <XCircle className="h-4 w-4 mr-1" /> Batalkan
              </Button>
            )}
          </div>
        )}
      />

      {/* Dialog Tambah Penyesuaian */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Penyesuaian</DialogTitle>
            <DialogDescription>
              Catat penyesuaian jumlah stok agar catatan sistem sesuai dengan jumlah fisik barang.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cooperative_id">Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) => setFormData({
                  ...formData,
                  cooperative_id: v ?? '',
                  warehouse_id: '',
                  location_id: '',
                })}
              >
                <SelectTrigger id="cooperative_id">
                  <SelectValue placeholder="Pilih koperasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih koperasi'
                      const item = coopOptions.find((c) => c.id === v)
                      return item ? `${item.code} - ${item.name}` : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {coopOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warehouse_id">Gudang</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(v) => setFormData({ ...formData, warehouse_id: v ?? '', location_id: '' })}
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
              <Label htmlFor="location_id">Lokasi</Label>
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
                onValueChange={(v) => setFormData({ ...formData, commodity_id: v ?? '', commodity_variant_id: '' })}
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

            {selectedCommodity && (selectedCommodity.variants?.length || 0) > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="commodity_variant_id">Varian (Opsional)</Label>
                <Select
                  value={formData.commodity_variant_id || 'NONE'}
                  onValueChange={(v) => setFormData({ ...formData, commodity_variant_id: v === 'NONE' ? '' : (v ?? '') })}
                >
                  <SelectTrigger id="commodity_variant_id">
                    <SelectValue placeholder="Tanpa varian">
                      {(v: string | null) => {
                        if (!v || v === 'NONE') return 'Tanpa varian'
                        const item = selectedCommodity.variants?.find((vr) => vr.id === v)
                        return item ? item.name : v
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Tanpa varian</SelectItem>
                    {selectedCommodity.variants?.map((vr) => (
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
                  placeholder="Contoh: A / B / C / REJECT"
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

            {availableStock !== null && formData.location_id && formData.commodity_id && (
              <p className="text-xs text-muted-foreground">
                Stok tersedia: {availableStock.toLocaleString('id-ID')} {selectedCommodity?.default_unit || 'unit'}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="adjustment_type">Tipe Penyesuaian</Label>
              <Select
                value={formData.adjustment_type}
                onValueChange={(v) => setFormData({ ...formData, adjustment_type: v ?? 'TAMBAH' })}
              >
                <SelectTrigger id="adjustment_type">
                  <SelectValue>
                    {(v: string | null) => (v === 'KURANG' ? 'Kurangi Stok' : 'Tambah Stok')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TAMBAH">Tambah Stok</SelectItem>
                  <SelectItem value="KURANG">Kurangi Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Jumlah{selectedCommodity ? ` (${selectedCommodity.default_unit})` : ''}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Contoh: 25"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Alasan</Label>
              <Select
                value={formData.reason}
                onValueChange={(v) => setFormData({ ...formData, reason: v ?? '' })}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Pilih alasan">
                    {(v: string | null) => v || 'Pilih alasan'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penyesuaian</DialogTitle>
            <DialogDescription>
              Informasi lengkap dokumen penyesuaian stok.
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Nomor Penyesuaian</span>
                <span className="font-mono text-xs">{detailItem.adjustment_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tanggal</span>
                <span>{formatDateTime(detailItem.created_at)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <Badge className={STATUS_COLORS[detailItem.status] || ''}>
                  {STATUS_LABELS[detailItem.status] || detailItem.status}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Koperasi</span>
                <span>{detailItem.cooperative ? `${detailItem.cooperative.code} - ${detailItem.cooperative.name}` : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Gudang</span>
                <span>{detailItem.warehouse ? `${detailItem.warehouse.code} - ${detailItem.warehouse.name}` : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Lokasi</span>
                <span>{detailItem.location ? `${detailItem.location.code} - ${detailItem.location.name}` : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Komoditas</span>
                <span>{detailItem.commodity?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Varian</span>
                <span>{detailItem.commodity_variant?.name || '-'}</span>
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
                <span className="text-muted-foreground">Tipe Penyesuaian</span>
                <Badge className={TYPE_COLORS[detailItem.adjustment_type] || ''}>
                  {TYPE_LABELS[detailItem.adjustment_type] || detailItem.adjustment_type}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-medium">
                  {Number(detailItem.quantity).toLocaleString('id-ID')} {detailItem.commodity?.default_unit || ''}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Alasan</span>
                <span className="text-right">{detailItem.reason}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Catatan</span>
                <span className="text-right">{detailItem.notes || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dibuat oleh</span>
                <span>{detailItem.created_by?.name || '-'}</span>
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
