'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'

interface Warehouse {
  id: string
  code: string
  name: string
  cooperative?: { id: string; code: string; name: string }
}

interface WarehouseLocation {
  id: string
  warehouse_id: string
  cooperative_id: string
  code: string
  name: string
  location_type: string
  status: string
  warehouse?: { id: string; code: string; name: string }
  cooperative?: { id: string; code: string; name: string }
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  TRANSIT: 'Transit',
  STOK_BAIK: 'Stok Baik',
  STOK_RUSAK: 'Stok Rusak / Ditolak',
  PENGIRIMAN: 'Pengiriman',
  PENYESUAIAN: 'Penyesuaian',
  LAINNYA: 'Lainnya',
}

const INITIAL_FORM = {
  warehouse_id: '',
  code: '',
  name: '',
  location_type: 'STOK_BAIK',
  status: 'AKTIF',
}

const LIMIT = 20

export default function LokasiGudangPage() {
  const [data, setData] = useState<WarehouseLocation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseFilter, setWarehouseFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WarehouseLocation | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch('/api/warehouses?limit=100').then((res) => {
      if (res.success && res.data) {
        setWarehouses(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(LIMIT))
    if (warehouseFilter) params.set('warehouse_id', warehouseFilter)

    const res = await apiFetch(`/api/warehouse-locations?${params.toString()}`)
    if (res.success) {
      setData(res.data || [])
      setTotal(res.meta?.total || 0)
    } else {
      toast.error(res.error?.message || 'Gagal memuat data lokasi gudang.')
    }
    setLoading(false)
  }, [page, warehouseFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const warehouseLabel = (w: Warehouse) =>
    w.cooperative ? `${w.code} - ${w.name} (${w.cooperative.name})` : `${w.code} - ${w.name}`

  const openCreate = () => {
    setEditingItem(null)
    setFormData(INITIAL_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: WarehouseLocation) => {
    setEditingItem(item)
    setFormData({
      warehouse_id: item.warehouse_id,
      code: item.code,
      name: item.name,
      location_type: item.location_type,
      status: item.status,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingItem && !formData.warehouse_id) {
      toast.error('Silakan pilih gudang terlebih dahulu.')
      return
    }
    setSaving(true)
    const res = editingItem
      ? await apiFetch(`/api/warehouse-locations/${editingItem.id}`, {
          method: 'PATCH',
          body: {
            code: formData.code,
            name: formData.name,
            location_type: formData.location_type,
            status: formData.status,
          },
        })
      : await apiFetch('/api/warehouse-locations', {
          method: 'POST',
          body: {
            warehouse_id: formData.warehouse_id,
            code: formData.code,
            name: formData.name,
            location_type: formData.location_type,
          },
        })
    if (res.success) {
      toast.success(editingItem ? 'Lokasi gudang berhasil diperbarui.' : 'Lokasi gudang berhasil ditambahkan.')
      setDialogOpen(false)
      setEditingItem(null)
      setFormData(INITIAL_FORM)
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan.')
    }
    setSaving(false)
  }

  const columns: Column<WarehouseLocation>[] = [
    { key: 'code', label: 'Kode Lokasi', render: (item) => <span className="font-medium">{item.code}</span> },
    { key: 'name', label: 'Nama Lokasi' },
    { key: 'warehouse', label: 'Gudang', render: (item) => item.warehouse?.name || '-' },
    { key: 'cooperative', label: 'Koperasi', render: (item) => item.cooperative?.name || '-' },
    {
      key: 'location_type',
      label: 'Tipe Lokasi',
      render: (item) => (
        <Badge variant="secondary">
          {LOCATION_TYPE_LABELS[item.location_type] || item.location_type}
        </Badge>
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
      title="Lokasi Gudang"
      description="Kelola lokasi penyimpanan di dalam gudang (transit, stok baik, stok rusak, dan lainnya)."
      permission="warehouse_locations.view"
    >
      <div className="flex justify-between items-end mb-4 gap-3 flex-wrap">
        <div className="min-w-[280px]">
          <Label className="text-xs">Gudang</Label>
          <Select
            value={warehouseFilter || 'ALL'}
            onValueChange={(v) => {
              setWarehouseFilter(!v || v === 'ALL' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Gudang">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Gudang'
                  const found = warehouses.find((w) => w.id === v)
                  return found ? warehouseLabel(found) : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Gudang</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {warehouseLabel(w)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Lokasi
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={LIMIT}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada data lokasi gudang."
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Lokasi Gudang' : 'Tambah Lokasi Gudang'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Perbarui data lokasi penyimpanan yang sudah ada.'
                : 'Tambahkan lokasi penyimpanan baru di dalam gudang.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="warehouse_id">Gudang</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(v) => setFormData({ ...formData, warehouse_id: v ?? '' })}
                disabled={!!editingItem}
              >
                <SelectTrigger id="warehouse_id">
                  <SelectValue placeholder="Pilih gudang">
                    {(v: string | null) => {
                      if (!v) return 'Pilih gudang'
                      const found = warehouses.find((w) => w.id === v)
                      return found ? warehouseLabel(found) : v
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {warehouseLabel(w)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingItem && (
                <p className="text-xs text-muted-foreground">
                  Gudang tidak dapat diubah setelah lokasi dibuat.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Kode Lokasi</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: STOK-BAIK-01"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lokasi</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Rak Stok Baik 1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location_type">Tipe Lokasi</Label>
              <Select
                value={formData.location_type}
                onValueChange={(v) => setFormData({ ...formData, location_type: v ?? 'STOK_BAIK' })}
              >
                <SelectTrigger id="location_type">
                  <SelectValue>
                    {(v: string | null) => (v ? LOCATION_TYPE_LABELS[v] || v : 'Pilih tipe lokasi')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingItem && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v ?? 'AKTIF' })}
                >
                  <SelectTrigger id="status">
                    <SelectValue>
                      {(v: string | null) => (v ? STATUS_LABELS[v] || v : 'Pilih status')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">{STATUS_LABELS['AKTIF'] || 'Aktif'}</SelectItem>
                    <SelectItem value="NONAKTIF">{STATUS_LABELS['NONAKTIF'] || 'Nonaktif'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
