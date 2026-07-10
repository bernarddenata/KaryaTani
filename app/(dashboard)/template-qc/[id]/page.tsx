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
import { formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const INPUT_TYPE_OPTIONS = [
  { value: 'ANGKA', label: 'Angka' },
  { value: 'PERSENTASE', label: 'Persentase' },
  { value: 'PILIHAN', label: 'Pilihan' },
  { value: 'CHECKLIST', label: 'Checklist' },
  { value: 'YA_TIDAK', label: 'Ya/Tidak' },
  { value: 'FOTO', label: 'Foto' },
  { value: 'CATATAN', label: 'Catatan' },
] as const

const INPUT_TYPE_LABELS: Record<string, string> = {
  ANGKA: 'Angka',
  PERSENTASE: 'Persentase',
  PILIHAN: 'Pilihan',
  CHECKLIST: 'Checklist',
  YA_TIDAK: 'Ya/Tidak',
  FOTO: 'Foto',
  CATATAN: 'Catatan',
}

interface QcTemplateItem {
  id: string
  qc_template_id: string
  item_name: string
  item_code: string
  input_type: string
  is_required: boolean
  requires_proof: boolean
  options_json: any
  min_value: number | null
  max_value: number | null
  help_text: string | null
  sort_order: number
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
  cooperative?: { id: string; code: string; name: string }
  commodity?: { id: string; code: string; name: string }
  commodity_variant?: { id: string; code: string; name: string } | null
  items: QcTemplateItem[]
}

const INITIAL_ITEM_FORM = {
  item_name: '',
  item_code: '',
  input_type: 'ANGKA',
  is_required: true,
  requires_proof: false,
  options_text: '',
  min_value: '',
  max_value: '',
  help_text: '',
  sort_order: '0',
}

export default function TemplateQCDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<QcTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QcTemplateItem | null>(null)
  const [formData, setFormData] = useState(INITIAL_ITEM_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch(`/api/qc-templates/${id}`)
    if (res.success) {
      setTemplate(res.data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => setFormData(INITIAL_ITEM_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const isEdit = !!editingItem
    const url = isEdit
      ? `/api/qc-template-items/${editingItem!.id}`
      : `/api/qc-templates/${id}/items`
    const method = isEdit ? 'PATCH' : 'POST'

    const body: any = {
      item_name: formData.item_name,
      item_code: formData.item_code,
      input_type: formData.input_type,
      is_required: formData.is_required,
      requires_proof: formData.requires_proof,
      sort_order: parseInt(formData.sort_order) || 0,
    }
    if (formData.help_text) body.help_text = formData.help_text
    if (formData.min_value) body.min_value = parseFloat(formData.min_value)
    if (formData.max_value) body.max_value = parseFloat(formData.max_value)
    if (formData.input_type === 'PILIHAN' && formData.options_text.trim()) {
      body.options_json = formData.options_text.split(',').map((o) => o.trim()).filter(Boolean)
    }

    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(isEdit ? 'Item QC berhasil diperbarui.' : 'Item QC berhasil ditambahkan.')
      setDialogOpen(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } else {
      toast.error(res.error?.message || 'Terjadi kesalahan.')
    }
    setSaving(false)
  }

  const handleDelete = async (item: QcTemplateItem) => {
    if (!confirm('Yakin ingin menghapus item QC ini?')) return
    const res = await apiFetch(`/api/qc-template-items/${item.id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Item QC berhasil dihapus.')
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

  const openEdit = (item: QcTemplateItem) => {
    setEditingItem(item)
    const optionsText = Array.isArray(item.options_json) ? item.options_json.join(', ') : ''
    setFormData({
      item_name: item.item_name,
      item_code: item.item_code,
      input_type: item.input_type,
      is_required: item.is_required,
      requires_proof: item.requires_proof,
      options_text: optionsText,
      min_value: item.min_value != null ? String(item.min_value) : '',
      max_value: item.max_value != null ? String(item.max_value) : '',
      help_text: item.help_text || '',
      sort_order: String(item.sort_order),
    })
    setDialogOpen(true)
  }

  const columns: Column<QcTemplateItem>[] = [
    { key: 'item_name', label: 'Nama Item QC' },
    { key: 'item_code', label: 'Kode Item' },
    {
      key: 'input_type',
      label: 'Tipe Input',
      render: (item) => INPUT_TYPE_LABELS[item.input_type] || item.input_type,
    },
    {
      key: 'is_required',
      label: 'Wajib?',
      render: (item) => item.is_required ? (
        <Badge className="bg-primary/15 text-primary">Ya</Badge>
      ) : (
        <span className="text-muted-foreground">Tidak</span>
      ),
    },
    {
      key: 'requires_proof',
      label: 'Bukti Foto?',
      render: (item) => item.requires_proof ? (
        <Badge className="bg-info/15 text-info">Ya</Badge>
      ) : (
        <span className="text-muted-foreground">Tidak</span>
      ),
    },
    {
      key: 'options_json',
      label: 'Pilihan',
      render: (item) => {
        if (!item.options_json || !Array.isArray(item.options_json)) return '-'
        return item.options_json.join(', ')
      },
    },
    { key: 'sort_order', label: 'Urutan' },
  ]

  if (loading && !template) {
    return (
      <DashboardShell title="Template QC" description="Memuat..." permission="qc_templates.view">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardShell>
    )
  }

  if (!template) {
    return (
      <DashboardShell title="Template QC" description="Data tidak ditemukan." permission="qc_templates.view">
        <p className="text-muted-foreground">Template QC tidak ditemukan.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title={template.name}
      description="Detail dan item template QC."
      permission="qc_templates.view"
    >
      <div className="mb-4">
        <Link href="/template-qc">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nama:</span>
              <p className="font-medium">{template.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Koperasi:</span>
              <p className="font-medium">{template.cooperative?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Komoditas:</span>
              <p className="font-medium">{template.commodity?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Varian:</span>
              <p className="font-medium">{template.commodity_variant?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Versi:</span>
              <p className="font-medium">v{template.version}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p>
                <Badge className={STATUS_COLORS[template.status] || ''}>
                  {STATUS_LABELS[template.status] || template.status}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Berlaku Mulai:</span>
              <p className="font-medium">{formatDate(template.valid_from)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Berlaku Sampai:</span>
              <p className="font-medium">{formatDate(template.valid_until)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Jumlah Item:</span>
              <p className="font-medium">{template.items.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Item QC</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Item QC
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={template.items}
        total={template.items.length}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item QC' : 'Tambah Item QC'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui item QC.' : 'Tambahkan item baru ke template QC.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item_name">Nama Item QC</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Contoh: Kadar Air"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item_code">Kode Item</Label>
                <Input
                  id="item_code"
                  value={formData.item_code}
                  onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                  placeholder="Contoh: KADAR_AIR"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="input_type">Tipe Input</Label>
              <Select
                value={formData.input_type}
                onValueChange={(v) => setFormData({ ...formData, input_type: v ?? 'ANGKA' })}
              >
                <SelectTrigger id="input_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_required: checked === true })
                  }
                />
                <Label htmlFor="is_required">Wajib?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_proof"
                  checked={formData.requires_proof}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_proof: checked === true })
                  }
                />
                <Label htmlFor="requires_proof">Butuh Bukti Foto?</Label>
              </div>
            </div>

            {formData.input_type === 'PILIHAN' && (
              <div className="grid gap-2">
                <Label htmlFor="options_text">Pilihan Jawaban</Label>
                <Input
                  id="options_text"
                  value={formData.options_text}
                  onChange={(e) => setFormData({ ...formData, options_text: e.target.value })}
                  placeholder="Pisahkan dengan koma, contoh: Baik, Sedang, Buruk"
                />
                <p className="text-xs text-muted-foreground">Pisahkan setiap pilihan dengan koma.</p>
              </div>
            )}

            {(formData.input_type === 'ANGKA' || formData.input_type === 'PERSENTASE') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_value">Nilai Minimum</Label>
                  <Input
                    id="min_value"
                    type="number"
                    value={formData.min_value}
                    onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_value">Nilai Maksimum</Label>
                  <Input
                    id="max_value"
                    type="number"
                    value={formData.max_value}
                    onChange={(e) => setFormData({ ...formData, max_value: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="help_text">Bantuan Pengisian</Label>
              <Input
                id="help_text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Opsional, petunjuk bagi petugas QC"
              />
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
