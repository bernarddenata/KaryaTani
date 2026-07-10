'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'

interface UserRole {
  role_id: string
  role?: { id: string; name: string; code: string }
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  last_login_at?: string
  user_roles?: UserRole[]
}

interface Role {
  id: string
  name: string
  code: string
}

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  status: 'ACTIVE',
  role_ids: [] as string[],
}

export default function PenggunaPage() {
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    const [usersRes, rolesRes] = await Promise.all([
      apiFetch(`/api/users?page=${p}&limit=20`),
      apiFetch('/api/roles'),
    ])
    if (usersRes.success) {
      setData(usersRes.data || [])
      setTotal(usersRes.meta?.total || usersRes.data?.length || 0)
    }
    if (rolesRes.success) {
      setRoles(rolesRes.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const resetForm = () => setFormData(INITIAL_FORM)

  const openCreate = () => {
    setEditingItem(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (item: User) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      email: item.email,
      phone: item.phone || '',
      password: '',
      status: item.status,
      role_ids: item.user_roles?.map((ur) => ur.role_id || ur.role?.id || '').filter(Boolean) || [],
    })
    setDialogOpen(true)
  }

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingItem) {
      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        status: formData.status,
        role_ids: formData.role_ids,
      }
      if (formData.password) body.password = formData.password

      const res = await apiFetch(`/api/users/${editingItem.id}`, { method: 'PATCH', body })
      if (res.success) {
        toast.success('Pengguna berhasil diperbarui')
        setDialogOpen(false)
        setEditingItem(null)
        resetForm()
        fetchData(page)
      } else {
        toast.error(res.error?.message || 'Terjadi kesalahan.')
      }
    } else {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role_ids: formData.role_ids,
        },
      })
      if (res.success) {
        toast.success('Pengguna berhasil ditambahkan')
        setDialogOpen(false)
        resetForm()
        fetchData(page)
      } else {
        toast.error(res.error?.message || 'Terjadi kesalahan.')
      }
    }
    setSaving(false)
  }

  const columns: Column<User>[] = [
    { key: 'name', label: 'Nama' },
    { key: 'email', label: 'Email' },
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
      key: 'user_roles',
      label: 'Peran',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.user_roles && item.user_roles.length > 0
            ? item.user_roles.map((ur) => (
                <Badge key={ur.role_id} variant="secondary" className="text-xs">
                  {ur.role?.name || ur.role?.code || ur.role_id}
                </Badge>
              ))
            : '-'}
        </div>
      ),
    },
    {
      key: 'last_login_at',
      label: 'Terakhir Login',
      render: (item) => formatDateTime(item.last_login_at),
    },
  ]

  return (
    <DashboardShell
      title="Pengguna"
      description="Kelola akun pengguna yang memiliki akses ke sistem koperasi."
      permission="users.view"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Pengguna
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
        emptyMessage="Tidak ada pengguna."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Perbarui informasi pengguna dan hak akses.'
                : 'Isi data untuk menambahkan pengguna baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Kata Sandi {editingItem ? '' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingItem ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                minLength={6}
                required={!editingItem}
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

            {editingItem && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v ?? '' })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Hak Akses</Label>
              <div className="grid gap-2 border rounded-md p-3">
                {roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Memuat peran...</p>
                ) : (
                  roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.role_ids.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm font-normal cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                  ))
                )}
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
