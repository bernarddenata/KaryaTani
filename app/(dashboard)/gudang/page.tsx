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
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import { useAuth } from '@/components/layout/auth-provider'

interface Warehouse {
  id: string
  cooperative_id: string
  code: string
  name: string
  address?: string | null
  status: string
  cooperative?: { id: string; code: string; name: string }
}

interface Cooperative {
  id: string
  code: string
  name: string
}

const INITIAL_FORM = {
  cooperative_id: '',
  code: '',
  name: '',
  address: '',
  status: 'AKTIF',
}

export default function GudangPage() {
  const { user } = useAuth()
  const [allData, setAllData] = useState<Warehouse[]>([])
  const [data, setData] = useState<Warehouse[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [selectedCoopId, setSelectedCoopId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false

  const fetchData = useCallback(async () => {
    setLoading(true)
    const url = selectedCoopId && selectedCoopId !== 'all'
      ? `/api/warehouses?limit=100&cooperative_id=${selectedCoopId}`
      : '/api/warehouses?limit=100'
    const [warehousesRes, coopsRes] = await Promise.all([
      apiFetch(url),
      apiFetch('/api/cooperatives'),
    ])
    if (warehousesRes.success) {
      setAllData(warehousesRes.data)
      setData(warehousesRes.data)
    }
    if (coopsRes.success) {
      setCooperatives(coopsRes.data)
    }
    setLoading(false)
  }, [selectedCoopId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!isGlobal && accessibleCoops.length === 1 && selectedCoopId === 'all') {
      setSelectedCoopId(accessibleCoops[0].id)
    }
  }, [isGlobal, accessibleCoops, selectedCoopId])

  const resetForm = () => setFormData(INITIAL_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const url = editingItem ? `/api/warehouses/${editingItem.id}` : '/api/warehouses'
    const method = editingItem ? 'PATCH' : 'POST'
    const body = editingItem
      ? {
          code: formData.code,
          name: formData.name,
          address: formData.address,
          status: formData.status,
        }
      : {
          cooperative_id: formData.cooperative_id,
          code: formData.code,
          name: formData.name,
          address: formData.address,
        }
    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(
        editingItem
          ? 'Data gudang berhasil diperbarui.'
          : 'Gudang berhasil dibuat. Lokasi standar (Transit, Stok Baik, Stok Rusak) otomatis ditambahkan.'
      )
      setDialogOpen(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan.')
    }
    setSaving(false)
  }

  const openCreate = () => {
    setEditingItem(null)
    resetForm()
    if (!isGlobal && accessibleCoops.length === 1) {
      setFormData({ ...INITIAL_FORM, cooperative_id: accessibleCoops[0].id })
    }
    setDialogOpen(true)
  }

  const openEdit = (item: Warehouse) => {
    setEditingItem(item)
    setFormData({
      cooperative_id: item.cooperative_id,
      code: item.code,
      name: item.name,
      address: item.address || '',
      status: item.status,
    })
    setDialogOpen(true)
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setData(allData)
      return
    }
    const q = query.toLowerCase()
    setData(allData.filter((w) =>
      w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)
    ))
  }

  const columns: Column<Warehouse>[] = [
    {
      key: 'code',
      label: 'Kode Gudang',
      render: (item) => <span className="font-mono text-sm">{item.code}</span>,
    },
    { key: 'name', label: 'Nama Gudang' },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (item) => item.address || '-',
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
      title="Gudang"
      description="Kelola gudang penyimpanan hasil tani milik koperasi."
      permission="warehouses.view"
    >
      <div className="flex justify-between items-end mb-4 gap-3 flex-wrap">
        {(isGlobal || accessibleCoops.length > 1) && (
          <div className="min-w-[280px]">
            <Label className="text-xs">Pilih Koperasi</Label>
            <Select value={selectedCoopId} onValueChange={(v) => setSelectedCoopId(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Koperasi">
                  {(v: string | null) => {
                    if (!v || v === 'all') return 'Semua Koperasi'
                    const found = cooperatives.find((c) => c.id === v)
                    return found ? `${found.code} - ${found.name}` : v
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Koperasi</SelectItem>
                {(isGlobal ? cooperatives : cooperatives.filter((c) => accessibleCoops.some((a) => a.id === c.id))).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!isGlobal && accessibleCoops.length === 1 && (
          <div className="text-xs text-muted-foreground">
            Data dibatasi pada koperasi: <strong>{accessibleCoops[0].name}</strong>
          </div>
        )}
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Gudang
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        loading={loading}
        onSearch={handleSearch}
        emptyMessage="Belum ada gudang."
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Gudang' : 'Tambah Gudang'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Perbarui data gudang yang sudah ada.'
                : 'Tambahkan gudang baru. Lokasi standar akan dibuat otomatis.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cooperative_id">Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) => setFormData({ ...formData, cooperative_id: v ?? '' })}
              >
                <SelectTrigger id="cooperative_id" disabled={!!editingItem}>
                  <SelectValue placeholder="Pilih koperasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih koperasi';
                      const item = cooperatives.find((c) => c.id === v);
                      return item ? `${item.code} - ${item.name}` : v;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(isGlobal ? cooperatives : cooperatives.filter((c) => accessibleCoops.some((a) => a.id === c.id))).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Kode Gudang</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: GDG-01"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nama Gudang</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Gudang Utama"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Opsional"
              />
            </div>

            {editingItem && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v ?? 'AKTIF' })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
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
