'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { formatRupiah, formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

interface PriceListItem {
  id: string
  price_list_id: string
  commodity_id: string
  commodity_variant_id: string | null
  grade_name: string
  grade_code: string
  price_per_unit: string | number
  unit: string
  is_reject: boolean
  sort_order: number
  commodity?: { id: string; code: string; name: string }
  commodity_variant?: { id: string; code: string; name: string } | null
}

interface PriceList {
  id: string
  cooperative_id: string
  name: string
  valid_from: string
  valid_until: string | null
  status: string
  cooperative?: { id: string; code: string; name: string }
  items: PriceListItem[]
}

const INITIAL_ITEM_FORM = {
  commodity_id: '',
  commodity_variant_id: '',
  grade_name: '',
  grade_code: '',
  price_per_unit: '',
  unit: 'kg',
  is_reject: false,
  sort_order: '0',
}

export default function DaftarHargaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [priceList, setPriceList] = useState<PriceList | null>(null)
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [variants, setVariants] = useState<CommodityVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null)
  const [formData, setFormData] = useState(INITIAL_ITEM_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [plRes, comRes] = await Promise.all([
      apiFetch(`/api/price-lists/${id}`),
      apiFetch('/api/commodities'),
    ])
    if (plRes.success) {
      setPriceList(plRes.data)
    }
    if (comRes.success) {
      setCommodities(comRes.data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (formData.commodity_id) {
      const commodity = commodities.find((c) => c.id === formData.commodity_id)
      setVariants(commodity?.variants || [])
    } else {
      setVariants([])
    }
  }, [formData.commodity_id, commodities])

  const resetForm = () => setFormData(INITIAL_ITEM_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const isEdit = !!editingItem
    const url = isEdit
      ? `/api/price-list-items/${editingItem!.id}`
      : `/api/price-lists/${id}/items`
    const method = isEdit ? 'PATCH' : 'POST'
    const body: any = {
      commodity_id: formData.commodity_id,
      grade_name: formData.grade_name,
      grade_code: formData.grade_code,
      price_per_unit: parseFloat(formData.price_per_unit) || 0,
      unit: formData.unit,
      is_reject: formData.is_reject,
      sort_order: parseInt(formData.sort_order) || 0,
    }
    if (formData.commodity_variant_id) {
      body.commodity_variant_id = formData.commodity_variant_id
    }
    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(isEdit ? 'Item berhasil diperbarui.' : 'Item berhasil ditambahkan.')
      setDialogOpen(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan.')
    }
    setSaving(false)
  }

  const handleDelete = async (item: PriceListItem) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return
    const res = await apiFetch(`/api/price-list-items/${item.id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Item berhasil dihapus.')
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan.')
    }
  }

  const openCreate = () => {
    setEditingItem(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (item: PriceListItem) => {
    setEditingItem(item)
    setFormData({
      commodity_id: item.commodity_id,
      commodity_variant_id: item.commodity_variant_id || '',
      grade_name: item.grade_name,
      grade_code: item.grade_code,
      price_per_unit: String(item.price_per_unit),
      unit: item.unit,
      is_reject: item.is_reject,
      sort_order: String(item.sort_order),
    })
    setDialogOpen(true)
  }

  const columns: Column<PriceListItem>[] = [
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
    { key: 'grade_name', label: 'Grade' },
    { key: 'grade_code', label: 'Kode Grade' },
    {
      key: 'price_per_unit',
      label: 'Harga per Satuan',
      render: (item) => formatRupiah(item.price_per_unit),
    },
    { key: 'unit', label: 'Satuan' },
    {
      key: 'is_reject',
      label: 'Reject?',
      render: (item) => item.is_reject ? (
        <Badge className="bg-red-100 text-red-800">Ya</Badge>
      ) : (
        <span className="text-muted-foreground">Tidak</span>
      ),
    },
    { key: 'sort_order', label: 'Urutan' },
  ]

  if (loading && !priceList) {
    return (
      <DashboardShell title="Daftar Harga" description="Memuat..." permission="price_lists.view">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </DashboardShell>
    )
  }

  if (!priceList) {
    return (
      <DashboardShell title="Daftar Harga" description="Data tidak ditemukan." permission="price_lists.view">
        <p className="text-muted-foreground">Daftar harga tidak ditemukan.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title={priceList.name}
      description="Detail dan item daftar harga."
      permission="price_lists.view"
    >
      <div className="mb-4">
        <Link href="/daftar-harga">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Daftar Harga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nama:</span>
              <p className="font-medium">{priceList.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Koperasi:</span>
              <p className="font-medium">{priceList.cooperative?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Berlaku Mulai:</span>
              <p className="font-medium">{formatDate(priceList.valid_from)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Berlaku Sampai:</span>
              <p className="font-medium">{formatDate(priceList.valid_until)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p>
                <Badge className={STATUS_COLORS[priceList.status] || ''}>
                  {STATUS_LABELS[priceList.status] || priceList.status}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Jumlah Item:</span>
              <p className="font-medium">{priceList.items.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Item Harga</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Item
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={priceList.items}
        total={priceList.items.length}
        loading={loading}
        actions={(item) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item Harga' : 'Tambah Item Harga'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui item harga.' : 'Tambahkan item baru ke daftar harga.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="commodity_id">Komoditas</Label>
              <Select
                value={formData.commodity_id}
                onValueChange={(v) => setFormData({ ...formData, commodity_id: v ?? '', commodity_variant_id: '' })}
              >
                <SelectTrigger id="commodity_id">
                  <SelectValue placeholder="Pilih komoditas">
                    {(v: string | null) => {
                      if (!v) return 'Pilih komoditas';
                      const item = commodities.find(c => c.id === v);
                      return item ? `${item.code} - ${item.name}` : v;
                    }}
                  </SelectValue>
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
                    <SelectValue placeholder="Pilih varian">
                      {(v: string | null) => {
                        if (!v) return 'Pilih varian';
                        const item = variants.find(x => x.id === v);
                        return item ? `${item.code} - ${item.name}` : v;
                      }}
                    </SelectValue>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade_name">Nama Grade</Label>
                <Input
                  id="grade_name"
                  value={formData.grade_name}
                  onChange={(e) => setFormData({ ...formData, grade_name: e.target.value })}
                  placeholder="Contoh: Grade A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grade_code">Kode Grade</Label>
                <Input
                  id="grade_code"
                  value={formData.grade_code}
                  onChange={(e) => setFormData({ ...formData, grade_code: e.target.value })}
                  placeholder="Contoh: GA"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_per_unit">Harga per Satuan (Rp)</Label>
                <Input
                  id="price_per_unit"
                  type="number"
                  min="0"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_reject"
                  checked={formData.is_reject}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_reject: checked === true })
                  }
                />
                <Label htmlFor="is_reject">Reject?</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort_order">Urutan</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
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
