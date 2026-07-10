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
import { STATUS_LABELS, STATUS_COLORS, RELATIONSHIP_TYPE_LABELS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'

interface Representative {
  id: string
  farmer_id: string
  name: string
  phone?: string
  relationship_type: string
  identity_number?: string
  status: string
  farmer?: { id: string; farmer_number: string; name: string }
}

interface Farmer {
  id: string
  farmer_number: string
  name: string
}

const INITIAL_FORM = {
  farmer_id: '',
  name: '',
  phone: '',
  relationship_type: 'PEGAWAI',
  identity_number: '',
}

export default function PengantarPage() {
  const [allData, setAllData] = useState<Representative[]>([])
  const [data, setData] = useState<Representative[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Representative | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [repsRes, farmersRes] = await Promise.all([
      apiFetch('/api/farmer-representatives'),
      apiFetch('/api/farmers'),
    ])
    if (repsRes.success) {
      setAllData(repsRes.data)
      setData(repsRes.data)
    }
    if (farmersRes.success) {
      setFarmers(farmersRes.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => setFormData(INITIAL_FORM)

  const handleSubmit = async () => {
    setSaving(true)
    const url = editingItem
      ? `/api/farmer-representatives/${editingItem.id}`
      : '/api/farmer-representatives'
    const method = editingItem ? 'PATCH' : 'POST'

    // For PATCH, do NOT send farmer_id (the update schema omits it)
    const body = editingItem
      ? {
          name: formData.name,
          phone: formData.phone,
          relationship_type: formData.relationship_type,
          identity_number: formData.identity_number,
        }
      : formData

    const res = await apiFetch(url, { method, body })
    if (res.success) {
      toast.success(editingItem ? 'Data pengantar berhasil diperbarui.' : 'Data pengantar berhasil ditambahkan.')
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

  const openEdit = (item: Representative) => {
    setEditingItem(item)
    setFormData({
      farmer_id: item.farmer_id,
      name: item.name,
      phone: item.phone || '',
      relationship_type: item.relationship_type,
      identity_number: item.identity_number || '',
    })
    setDialogOpen(true)
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setData(allData)
      return
    }
    const q = query.toLowerCase()
    setData(allData.filter((r) => r.name.toLowerCase().includes(q)))
  }

  const columns: Column<Representative>[] = [
    { key: 'name', label: 'Nama Pengantar' },
    {
      key: 'farmer',
      label: 'Pemilik Hasil Tani',
      render: (item) => item.farmer?.name || '-',
    },
    { key: 'phone', label: 'Nomor HP', render: (item) => item.phone || '-' },
    {
      key: 'relationship_type',
      label: 'Hubungan',
      render: (item) => RELATIONSHIP_TYPE_LABELS[item.relationship_type] || item.relationship_type,
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
      title="Pengantar"
      description="Kelola data pengantar atau perwakilan yang mengirim hasil tani atas nama pemilik."
      permission="farmer_representatives.view"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Pengantar
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
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Pengantar' : 'Tambah Pengantar'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data pengantar yang sudah ada.' : 'Tambahkan data pengantar baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!editingItem && (
              <div className="grid gap-2">
                <Label htmlFor="farmer_id">Pilih Petani</Label>
                <Select
                  value={formData.farmer_id}
                  onValueChange={(v) => setFormData({ ...formData, farmer_id: v ?? '' })}
                >
                  <SelectTrigger id="farmer_id">
                    <SelectValue placeholder="Pilih petani" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.farmer_number} - {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                placeholder="Opsional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relationship_type">Hubungan</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(v) => setFormData({ ...formData, relationship_type: v ?? 'PEGAWAI' })}
              >
                <SelectTrigger id="relationship_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="identity_number">Nomor Identitas</Label>
              <Input
                id="identity_number"
                value={formData.identity_number}
                onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
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
