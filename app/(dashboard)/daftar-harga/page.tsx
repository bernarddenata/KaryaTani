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
import { formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil, Eye } from 'lucide-react'
import Link from 'next/link'

interface Cooperative {
  id: string
  code: string
  name: string
}

interface PriceList {
  id: string
  cooperative_id: string
  name: string
  valid_from: string
  valid_until: string | null
  status: string
  created_at: string
  cooperative?: Cooperative
  _count?: { items: number }
}

const STATUS_OPTIONS = ['DRAFT', 'AKTIF', 'NONAKTIF', 'KEDALUWARSA'] as const

const INITIAL_FORM = {
  cooperative_id: '',
  name: '',
  valid_from: '',
  valid_until: '',
  status: 'DRAFT',
}

export default function DaftarHargaPage() {
  const [allData, setAllData] = useState<PriceList[]>([])
  const [data, setData] = useState<PriceList[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PriceList | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [priceListsRes, coopsRes] = await Promise.all([
      apiFetch('/api/price-lists'),
      apiFetch('/api/cooperatives'),
    ])
    if (priceListsRes.success) {
      setAllData(priceListsRes.data)
      setData(priceListsRes.data)
    }
    if (coopsRes.success) {
      setCooperatives(coopsRes.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => setFormData(INITIAL_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const url = editingItem ? `/api/price-lists/${editingItem.id}` : '/api/price-lists'
    const method = editingItem ? 'PATCH' : 'POST'
    const body: any = {
      cooperative_id: formData.cooperative_id,
      name: formData.name,
      valid_from: formData.valid_from,
      status: formData.status,
    }
    if (formData.valid_until) body.valid_until = formData.valid_until
    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(editingItem ? 'Daftar harga berhasil diperbarui.' : 'Daftar harga berhasil ditambahkan.')
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
    setDialogOpen(true)
  }

  const openEdit = (item: PriceList) => {
    setEditingItem(item)
    setFormData({
      cooperative_id: item.cooperative_id,
      name: item.name,
      valid_from: item.valid_from ? item.valid_from.slice(0, 10) : '',
      valid_until: item.valid_until ? item.valid_until.slice(0, 10) : '',
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
    setData(allData.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.cooperative?.name.toLowerCase().includes(q)
    ))
  }

  const columns: Column<PriceList>[] = [
    { key: 'name', label: 'Nama' },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'valid_from',
      label: 'Berlaku Mulai',
      render: (item) => formatDate(item.valid_from),
    },
    {
      key: 'valid_until',
      label: 'Berlaku Sampai',
      render: (item) => formatDate(item.valid_until),
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
    {
      key: '_count',
      label: 'Jumlah Item',
      render: (item) => item._count?.items ?? 0,
    },
  ]

  return (
    <DashboardShell
      title="Daftar Harga"
      description="Kelola daftar harga komoditas per grade yang berlaku di koperasi."
      permission="price_lists.view"
    >
      <p className="text-sm text-muted-foreground mb-4">
        Daftar harga digunakan untuk menghitung nilai penjualan petani. Jika harga berubah, transaksi lama tidak ikut berubah.
      </p>

      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Daftar Harga
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        loading={loading}
        onSearch={handleSearch}
        actions={(item) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Link href={`/daftar-harga/${item.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Daftar Harga' : 'Tambah Daftar Harga'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data daftar harga yang sudah ada.' : 'Tambahkan daftar harga baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cooperative_id">Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) => setFormData({ ...formData, cooperative_id: v ?? '' })}
              >
                <SelectTrigger id="cooperative_id">
                  <SelectValue placeholder="Pilih koperasi" />
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
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Harga Kopi Januari 2026"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid_from">Berlaku Mulai</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid_until">Berlaku Sampai</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                placeholder="Opsional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v ?? 'DRAFT' })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value] || value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </DashboardShell>
  )
}
