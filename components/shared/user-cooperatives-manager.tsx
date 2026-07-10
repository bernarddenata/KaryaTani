'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { toast } from 'sonner'
import { Plus, Star, StarOff, Trash2 } from 'lucide-react'

interface Cooperative {
  id: string
  code: string
  name: string
  status: string
}

interface Assignment {
  id: string
  cooperative_id: string
  assignment_type: string
  is_primary: boolean
  status: string
  cooperative: Cooperative
}

const ASSIGNMENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'PEGAWAI', label: 'Pegawai' },
  { value: 'ADMIN_KOPERASI', label: 'Admin Koperasi' },
  { value: 'PETUGAS_QC', label: 'Petugas QC' },
  { value: 'SUPERVISOR_QC', label: 'Supervisor QC' },
  { value: 'STAFF_KEUANGAN', label: 'Staff Keuangan' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'VIEWER', label: 'Viewer' },
]

function assignmentLabel(code: string): string {
  return ASSIGNMENT_TYPES.find((t) => t.value === code)?.label || code
}

export function UserCooperativesManager({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allCoops, setAllCoops] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState({
    cooperative_id: '',
    assignment_type: 'PEGAWAI',
    is_primary: false,
  })
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [res, coopRes] = await Promise.all([
      apiFetch(`/api/users/${userId}/cooperatives`),
      apiFetch('/api/cooperatives'),
    ])
    if (res.success) setAssignments(res.data || [])
    if (coopRes.success) setAllCoops(coopRes.data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) refresh()
  }, [userId, refresh])

  const availableCoops = allCoops.filter(
    (c) => !assignments.some((a) => a.cooperative_id === c.id)
  )

  const handleAdd = async () => {
    if (!addForm.cooperative_id) {
      toast.error('Pilih koperasi terlebih dahulu.')
      return
    }
    setBusyId('add')
    const res = await apiFetch(`/api/users/${userId}/cooperatives`, {
      method: 'POST',
      body: addForm,
    })
    if (res.success) {
      toast.success('Koperasi berhasil ditambahkan.')
      setAddForm({ cooperative_id: '', assignment_type: 'PEGAWAI', is_primary: false })
      refresh()
    } else {
      toast.error(res.error?.message || 'Gagal menambahkan koperasi.')
    }
    setBusyId(null)
  }

  const handleTogglePrimary = async (a: Assignment) => {
    setBusyId(a.id)
    const res = await apiFetch(`/api/user-cooperatives/${a.id}`, {
      method: 'PATCH',
      body: { is_primary: !a.is_primary },
    })
    if (res.success) refresh()
    else toast.error(res.error?.message || 'Gagal mengubah status primer.')
    setBusyId(null)
  }

  const handleToggleStatus = async (a: Assignment) => {
    setBusyId(a.id)
    const next = a.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF'
    const res = await apiFetch(`/api/user-cooperatives/${a.id}`, {
      method: 'PATCH',
      body: { status: next },
    })
    if (res.success) refresh()
    else toast.error(res.error?.message || 'Gagal mengubah status.')
    setBusyId(null)
  }

  const handleRemove = async (a: Assignment) => {
    if (!confirm(`Hapus akses ke ${a.cooperative.name}?`)) return
    setBusyId(a.id)
    const res = await apiFetch(`/api/user-cooperatives/${a.id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Pemetaan dihapus.')
      refresh()
    } else {
      toast.error(res.error?.message || 'Gagal menghapus pemetaan.')
    }
    setBusyId(null)
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <Label className="text-base">Koperasi yang Dapat Diakses</Label>
        <span className="text-xs text-muted-foreground">
          {assignments.length} penugasan
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Pengaturan ini menentukan data koperasi mana yang bisa dilihat dan dikelola oleh pengguna.
      </p>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Memuat...</div>
        ) : assignments.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            Pengguna belum memiliki akses koperasi. Tambahkan koperasi agar pengguna dapat melihat data operasional.
          </div>
        ) : (
          <ul className="divide-y">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{a.cooperative.name}</span>
                    {a.is_primary && (
                      <Badge className="bg-amber-100 text-amber-800">Utama</Badge>
                    )}
                    <Badge
                      className={
                        a.status === 'AKTIF'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {a.status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.cooperative.code} · {assignmentLabel(a.assignment_type)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === a.id}
                  onClick={() => handleTogglePrimary(a)}
                  title={a.is_primary ? 'Batal jadikan utama' : 'Jadikan koperasi utama'}
                >
                  {a.is_primary ? (
                    <StarOff className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === a.id}
                  onClick={() => handleToggleStatus(a)}
                >
                  {a.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === a.id}
                  onClick={() => handleRemove(a)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {availableCoops.length > 0 && (
        <div className="rounded-md border p-3 grid gap-2">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-xs">Koperasi</Label>
              <Select
                value={addForm.cooperative_id}
                onValueChange={(v) => setAddForm({ ...addForm, cooperative_id: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Koperasi">
                    {(v: string | null) => {
                      const found = availableCoops.find((c) => c.id === v)
                      return found ? `${found.code} - ${found.name}` : 'Pilih Koperasi'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCoops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Jenis Penugasan</Label>
              <Select
                value={addForm.assignment_type}
                onValueChange={(v) => setAddForm({ ...addForm, assignment_type: v ?? 'PEGAWAI' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={addForm.is_primary}
                onChange={(e) => setAddForm({ ...addForm, is_primary: e.target.checked })}
              />
              Jadikan koperasi utama
            </label>
            <Button size="sm" onClick={handleAdd} disabled={busyId === 'add'}>
              <Plus className="h-4 w-4 mr-1" />
              {busyId === 'add' ? 'Menyimpan...' : 'Tambahkan Koperasi'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
