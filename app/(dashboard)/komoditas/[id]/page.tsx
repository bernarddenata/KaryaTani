'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, Column } from '@/components/shared/data-table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS, formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'

interface Commodity {
  id: string
  code: string
  name: string
  category?: string
  default_unit: string
  description?: string
  image_url?: string | null
  status: string
  created_at: string
  variants?: CommodityVariant[]
}

interface CommodityVariant {
  id: string
  commodity_id: string
  code: string
  name: string
  unit: string
  description?: string
  status: string
  created_at: string
}

interface VariantForm {
  code: string
  name: string
  unit: string
  description: string
}

export default function KomoditasDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [commodity, setCommodity] = useState<Commodity | null>(null)
  const [loading, setLoading] = useState(true)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<CommodityVariant | null>(null)
  const [variantForm, setVariantForm] = useState<VariantForm>({
    code: '', name: '', unit: 'kg', description: '',
  })
  const [savingVariant, setSavingVariant] = useState(false)

  const fetchCommodity = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<Commodity>(`/api/commodities/${id}`)
      if (res.success && res.data) setCommodity(res.data)
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchCommodity()
  }, [id, fetchCommodity])

  function openCreateVariant() {
    setEditingVariant(null)
    setVariantForm({
      code: '',
      name: '',
      unit: commodity?.default_unit || 'kg',
      description: '',
    })
    setVariantDialogOpen(true)
  }

  function openEditVariant(variant: CommodityVariant) {
    setEditingVariant(variant)
    setVariantForm({
      code: variant.code,
      name: variant.name,
      unit: variant.unit,
      description: variant.description || '',
    })
    setVariantDialogOpen(true)
  }

  async function handleSaveVariant() {
    if (!variantForm.code.trim() || !variantForm.name.trim()) {
      toast.error('Kode dan nama varian wajib diisi.')
      return
    }

    setSavingVariant(true)
    try {
      if (editingVariant) {
        const res = await apiFetch(`/api/commodity-variants/${editingVariant.id}`, {
          method: 'PATCH',
          body: variantForm,
        })
        if (res.success) {
          toast.success('Varian berhasil diperbarui.')
          setVariantDialogOpen(false)
          fetchCommodity()
        } else {
          toast.error(res.error?.message || 'Gagal memperbarui varian.')
        }
      } else {
        const res = await apiFetch('/api/commodity-variants', {
          method: 'POST',
          body: { ...variantForm, commodity_id: id },
        })
        if (res.success) {
          toast.success('Varian berhasil ditambahkan.')
          setVariantDialogOpen(false)
          fetchCommodity()
        } else {
          toast.error(res.error?.message || 'Gagal menambahkan varian.')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan varian.')
    } finally {
      setSavingVariant(false)
    }
  }

  const variantColumns: Column<CommodityVariant>[] = [
    { key: 'code', label: 'Kode' },
    { key: 'name', label: 'Nama' },
    { key: 'unit', label: 'Satuan' },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (v) => v.description || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge className={STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[v.status] || v.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (v) => (
        <Button variant="ghost" size="sm" onClick={() => openEditVariant(v)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <DashboardShell title="Detail Komoditas" description="Informasi komoditas dan daftar varian." permission="commodities.view">
      <div className="mb-4">
        <Link href="/komoditas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        </div>
      ) : !commodity ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data komoditas tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Commodity Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{commodity.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {commodity.image_url && (
                <div className="mb-4">
                  <img
                    src={commodity.image_url}
                    alt={commodity.name}
                    className="h-40 w-40 rounded-lg border object-cover"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kode</p>
                  <p className="font-medium">{commodity.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="font-medium">{commodity.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Satuan Default</p>
                  <p className="font-medium">{commodity.default_unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={STATUS_COLORS[commodity.status] || 'bg-gray-100 text-gray-800'}>
                    {STATUS_LABELS[commodity.status] || commodity.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deskripsi</p>
                  <p className="font-medium">{commodity.description || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dibuat</p>
                  <p className="font-medium">{formatDate(commodity.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Varian</CardTitle>
                <Button size="sm" onClick={openCreateVariant}>
                  <Plus className="h-4 w-4 mr-1" /> Tambah Varian
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={variantColumns}
                data={commodity.variants || []}
                total={commodity.variants?.length || 0}
                emptyMessage="Belum ada varian untuk komoditas ini."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Edit Varian' : 'Tambah Varian'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variant-code">Kode</Label>
              <Input
                id="variant-code"
                value={variantForm.code}
                onChange={(e) => setVariantForm({ ...variantForm, code: e.target.value })}
                placeholder="Contoh: TBS-A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-name">Nama</Label>
              <Input
                id="variant-name"
                value={variantForm.name}
                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                placeholder="Contoh: TBS Grade A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-unit">Satuan</Label>
              <Input
                id="variant-unit"
                value={variantForm.unit}
                onChange={(e) => setVariantForm({ ...variantForm, unit: e.target.value })}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-description">Deskripsi</Label>
              <Textarea
                id="variant-description"
                value={variantForm.description}
                onChange={(e) => setVariantForm({ ...variantForm, description: e.target.value })}
                placeholder="Deskripsi varian (opsional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialogOpen(false)} disabled={savingVariant}>
              Batal
            </Button>
            <Button onClick={handleSaveVariant} disabled={savingVariant}>
              {savingVariant ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
