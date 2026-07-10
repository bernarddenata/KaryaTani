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
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil, Eye } from 'lucide-react'
import Link from 'next/link'

interface CommodityVariant {
  id: string
  commodity_id: string
  code: string
  name: string
  unit: string
  description?: string
  status: string
}

interface Commodity {
  id: string
  code: string
  name: string
  category?: string
  default_unit: string
  description?: string
  status: string
  variants?: CommodityVariant[]
}

const INITIAL_FORM = {
  code: '',
  name: '',
  category: '',
  default_unit: 'kg',
  description: '',
}

export default function KomoditasPage() {
  const [allData, setAllData] = useState<Commodity[]>([])
  const [data, setData] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Commodity | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch('/api/commodities')
    if (res.success) {
      setAllData(res.data)
      setData(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => setFormData(INITIAL_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const url = editingItem ? `/api/commodities/${editingItem.id}` : '/api/commodities'
    const method = editingItem ? 'PATCH' : 'POST'
    const res = await apiFetch(url, { method, body: formData })
    if (res.success) {
      toast.success(editingItem ? 'Data komoditas berhasil diperbarui.' : 'Data komoditas berhasil ditambahkan.')
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

  const openEdit = (item: Commodity) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category || '',
      default_unit: item.default_unit,
      description: item.description || '',
    })
    setDialogOpen(true)
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setData(allData)
      return
    }
    const q = query.toLowerCase()
    setData(allData.filter((c) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ))
  }

  const columns: Column<Commodity>[] = [
    { key: 'code', label: 'Kode' },
    { key: 'name', label: 'Nama' },
    { key: 'category', label: 'Kategori', render: (item) => item.category || '-' },
    { key: 'default_unit', label: 'Satuan Default' },
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
      key: 'variants',
      label: 'Jumlah Varian',
      render: (item) => item.variants?.length || 0,
    },
  ]

  return (
    <DashboardShell
      title="Komoditas"
      description="Kelola jenis komoditas dan varian hasil tani yang diterima koperasi."
      permission="commodities.view"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Komoditas
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
            <Link href={`/komoditas/${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Komoditas' : 'Tambah Komoditas'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data komoditas yang sudah ada.' : 'Tambahkan data komoditas baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Opsional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default_unit">Satuan Default</Label>
              <Input
                id="default_unit"
                value={formData.default_unit}
                onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opsional"
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
    </DashboardShell>
  )
}
