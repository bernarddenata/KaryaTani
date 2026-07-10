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
import { STATUS_LABELS, STATUS_COLORS, SELLER_TYPE_LABELS } from '@/lib/utils/format'
import { ImageUpload } from '@/components/shared/image-upload'
import { toast } from 'sonner'
import { Plus, Pencil, Eye, User } from 'lucide-react'
import Link from 'next/link'

interface Farmer {
  id: string
  cooperative_id: string
  farmer_number: string
  name: string
  phone: string
  nik?: string
  address?: string
  village?: string
  seller_type: string
  photo_url?: string
  verification_status: string
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
  farmer_number: '',
  name: '',
  phone: '',
  nik: '',
  address: '',
  village: '',
  seller_type: 'PEMILIK_LAHAN',
  photo_url: '',
  verification_status: 'BELUM_DIVERIFIKASI',
}

const VERIFICATION_OPTIONS = [
  'BELUM_DIVERIFIKASI',
  'MENUNGGU_VERIFIKASI',
  'TERVERIFIKASI',
  'DITOLAK',
] as const

export default function PetaniPage() {
  const [allData, setAllData] = useState<Farmer[]>([])
  const [data, setData] = useState<Farmer[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Farmer | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [farmersRes, coopsRes] = await Promise.all([
      apiFetch('/api/farmers'),
      apiFetch('/api/cooperatives'),
    ])
    if (farmersRes.success) {
      setAllData(farmersRes.data)
      setData(farmersRes.data)
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
    const url = editingItem ? `/api/farmers/${editingItem.id}` : '/api/farmers'
    const method = editingItem ? 'PATCH' : 'POST'
    const res = await apiFetch(url, { method, body: formData })
    if (res.success) {
      toast.success(editingItem ? 'Data petani berhasil diperbarui.' : 'Data petani berhasil ditambahkan.')
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

  const openEdit = (item: Farmer) => {
    setEditingItem(item)
    setFormData({
      cooperative_id: item.cooperative_id,
      farmer_number: item.farmer_number,
      name: item.name,
      phone: item.phone,
      nik: item.nik || '',
      address: item.address || '',
      village: item.village || '',
      seller_type: item.seller_type,
      photo_url: item.photo_url || '',
      verification_status: item.verification_status,
    })
    setDialogOpen(true)
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setData(allData)
      return
    }
    const q = query.toLowerCase()
    setData(allData.filter((f) =>
      f.name.toLowerCase().includes(q) || f.farmer_number.toLowerCase().includes(q)
    ))
  }

  const columns: Column<Farmer>[] = [
    {
      key: 'name',
      label: 'Petani',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="h-10 w-10 rounded-full object-cover border" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.farmer_number}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Nomor HP' },
    { key: 'village', label: 'Desa', render: (item) => item.village || '-' },
    {
      key: 'seller_type',
      label: 'Tipe Penjual',
      render: (item) => SELLER_TYPE_LABELS[item.seller_type] || item.seller_type,
    },
    {
      key: 'verification_status',
      label: 'Verifikasi',
      render: (item) => (
        <Badge className={STATUS_COLORS[item.verification_status] || ''}>
          {STATUS_LABELS[item.verification_status] || item.verification_status}
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
      title="Petani / Pemilik"
      description="Kelola data pemilik hasil tani yang berhak menerima pembayaran dari koperasi."
      permission="farmers.view"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Petani
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
            <Link href={`/petani/${item.id}`}>
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
            <DialogTitle>{editingItem ? 'Edit Petani' : 'Tambah Petani'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data petani yang sudah ada.' : 'Tambahkan data petani baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Foto Profil</Label>
              <ImageUpload
                value={formData.photo_url || null}
                onUploaded={(fileUrl) => setFormData({ ...formData, photo_url: fileUrl })}
                onRemoved={() => setFormData({ ...formData, photo_url: '' })}
                entityType="Farmer"
                entityId={editingItem?.id}
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cooperative_id">Koperasi</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(v) => setFormData({ ...formData, cooperative_id: v ?? '' })}
              >
                <SelectTrigger id="cooperative_id">
                  <SelectValue placeholder="Pilih koperasi">
                    {(v: string | null) => {
                      if (!v) return 'Pilih koperasi';
                      const item = cooperatives.find(c => c.id === v);
                      return item ? `${item.code} - ${item.name}` : v;
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
              <Label htmlFor="farmer_number">Nomor Petani</Label>
              <Input
                id="farmer_number"
                value={formData.farmer_number}
                onChange={(e) => setFormData({ ...formData, farmer_number: e.target.value })}
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
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="Opsional"
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

            <div className="grid gap-2">
              <Label htmlFor="village">Desa</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="Opsional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seller_type">Tipe Penjual</Label>
              <Select
                value={formData.seller_type}
                onValueChange={(v) => setFormData({ ...formData, seller_type: v ?? 'PEMILIK_LAHAN' })}
              >
                <SelectTrigger id="seller_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SELLER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="verification_status">Status Verifikasi</Label>
              <Select
                value={formData.verification_status}
                onValueChange={(v) => setFormData({ ...formData, verification_status: v ?? 'BELUM_DIVERIFIKASI' })}
              >
                <SelectTrigger id="verification_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_OPTIONS.map((value) => (
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
