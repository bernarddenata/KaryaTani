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

interface Commodity {
  id: string
  code: string
  name: string
  variants?: CommodityVariant[]
}

interface CommodityVariant {
  id: string
  code: string
  name: string
  commodity_id: string
}

interface QcTemplate {
  id: string
  cooperative_id: string
  commodity_id: string
  commodity_variant_id: string | null
  name: string
  version: number
  valid_from: string
  valid_until: string | null
  status: string
  cooperative?: Cooperative
  commodity?: { id: string; code: string; name: string }
  commodity_variant?: { id: string; code: string; name: string } | null
  _count?: { items: number }
}

const STATUS_OPTIONS = ['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'] as const

const INITIAL_FORM = {
  cooperative_id: '',
  commodity_id: '',
  commodity_variant_id: '',
  name: '',
  version: '1',
  valid_from: '',
  valid_until: '',
  status: 'DRAFT',
}

export default function TemplateQCPage() {
  const [allData, setAllData] = useState<QcTemplate[]>([])
  const [data, setData] = useState<QcTemplate[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [variants, setVariants] = useState<CommodityVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QcTemplate | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [templatesRes, coopsRes, comRes] = await Promise.all([
      apiFetch('/api/qc-templates'),
      apiFetch('/api/cooperatives'),
      apiFetch('/api/commodities'),
    ])
    if (templatesRes.success) {
      setAllData(templatesRes.data)
      setData(templatesRes.data)
    }
    if (coopsRes.success) {
      setCooperatives(coopsRes.data)
    }
    if (comRes.success) {
      setCommodities(comRes.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (formData.commodity_id) {
      const commodity = commodities.find((c) => c.id === formData.commodity_id)
      setVariants(commodity?.variants || [])
    } else {
      setVariants([])
    }
  }, [formData.commodity_id, commodities])

  const resetForm = () => setFormData(INITIAL_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const url = editingItem ? `/api/qc-templates/${editingItem.id}` : '/api/qc-templates'
    const method = editingItem ? 'PATCH' : 'POST'
    const body: any = {
      cooperative_id: formData.cooperative_id,
      commodity_id: formData.commodity_id,
      name: formData.name,
      version: parseInt(formData.version) || 1,
      valid_from: formData.valid_from,
      status: formData.status,
    }
    if (formData.commodity_variant_id) body.commodity_variant_id = formData.commodity_variant_id
    if (formData.valid_until) body.valid_until = formData.valid_until
    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(editingItem ? 'Template QC berhasil diperbarui.' : 'Template QC berhasil ditambahkan.')
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

  const openEdit = (item: QcTemplate) => {
    setEditingItem(item)
    setFormData({
      cooperative_id: item.cooperative_id,
      commodity_id: item.commodity_id,
      commodity_variant_id: item.commodity_variant_id || '',
      name: item.name,
      version: String(item.version),
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
    setData(allData.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.cooperative?.name.toLowerCase().includes(q) ||
      t.commodity?.name.toLowerCase().includes(q)
    ))
  }

  const columns: Column<QcTemplate>[] = [
    { key: 'name', label: 'Nama Template' },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => item.commodity?.name || '-',
    },
    {
      key: 'commodity_variant',
      label: 'Varian',
      render: (item) => item.commodity_variant?.name || '-',
    },
    {
      key: 'version',
      label: 'Versi',
      render: (item) => `v${item.version}`,
    },
    {
      key: 'valid_from',
      label: 'Berlaku Mulai',
      render: (item) => formatDate(item.valid_from),
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
      label: 'Jumlah Item QC',
      render: (item) => item._count?.items ?? 0,
    },
  ]

  return (
    <DashboardShell
      title="Template QC"
      description="Kelola template pemeriksaan kualitas untuk setiap jenis komoditas."
      permission="qc_templates.view"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Template
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
            <Link href={`/template-qc/${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Template QC' : 'Tambah Template QC'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data template QC.' : 'Tambahkan template QC baru.'}
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
              <Label htmlFor="commodity_id">Komoditas</Label>
              <Select
                value={formData.commodity_id}
                onValueChange={(v) => setFormData({ ...formData, commodity_id: v ?? '', commodity_variant_id: '' })}
              >
                <SelectTrigger id="commodity_id">
                  <SelectValue placeholder="Pilih komoditas" />
                </SelectTrigger>
                <SelectContent>
                  {commodities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {variants.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="commodity_variant_id">Varian (opsional)</Label>
                <Select
                  value={formData.commodity_variant_id}
                  onValueChange={(v) => setFormData({ ...formData, commodity_variant_id: v ?? '' })}
                >
                  <SelectTrigger id="commodity_variant_id">
                    <SelectValue placeholder="Pilih varian" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.code} - {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Nama Template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: QC Kopi Robusta v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="version">Versi</Label>
                <Input
                  id="version"
                  type="number"
                  min="1"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
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

            <div className="grid grid-cols-2 gap-4">
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
