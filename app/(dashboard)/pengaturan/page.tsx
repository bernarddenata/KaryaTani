'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { Building2, Server, Users } from 'lucide-react'

interface Cooperative {
  id: string
  name: string
  code: string
  province?: string
  city?: string
  district?: string
  village?: string
  address?: string
  legal_number?: string
  status: string
}

interface UserAssignment {
  assignment_id: string
  assignment_type: string
  is_primary: boolean
  status: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    status: string
    roles: Array<{ id: string; code: string; name: string }>
  }
}

const ASSIGNMENT_LABELS: Record<string, string> = {
  PEGAWAI: 'Pegawai',
  ADMIN_KOPERASI: 'Admin Koperasi',
  PETUGAS_QC: 'Petugas QC',
  SUPERVISOR_QC: 'Supervisor QC',
  STAFF_KEUANGAN: 'Staff Keuangan',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
}

export default function PengaturanPage() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<UserAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const res = await apiFetch('/api/cooperatives')
      if (res.success && res.data) {
        const list: Cooperative[] = Array.isArray(res.data) ? res.data : [res.data]
        setCooperatives(list)
        if (list.length > 0) setSelectedId(list[0].id)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    async function fetchUsers() {
      setLoadingUsers(true)
      const res = await apiFetch(`/api/cooperatives/${selectedId}/users`)
      if (!cancelled) {
        if (res.success) setAssignments(res.data || [])
        else setAssignments([])
        setLoadingUsers(false)
      }
    }
    fetchUsers()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selected = cooperatives.find((c) => c.id === selectedId) || null

  if (loading) {
    return (
      <DashboardShell
        title="Pengaturan"
        description="Konfigurasi pengaturan umum sistem koperasi."
        permission="settings.view"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Pengaturan"
      description="Konfigurasi pengaturan umum sistem koperasi."
      permission="settings.view"
    >
      {cooperatives.length > 1 && (
        <div className="mb-4 max-w-md">
          <label className="text-sm font-medium block mb-1">Pilih Koperasi</label>
          <Select value={selectedId ?? undefined} onValueChange={(v) => setSelectedId(v ?? null)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Koperasi">
                {(v: string | null) => {
                  const found = cooperatives.find((c) => c.id === v)
                  return found ? `${found.code} - ${found.name}` : 'Pilih Koperasi'
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
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Informasi Koperasi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-3">
                <InfoRow label="Nama Koperasi" value={selected.name} />
                <InfoRow label="Kode" value={selected.code} mono />
                <InfoRow label="Provinsi" value={selected.province} />
                <InfoRow label="Kota" value={selected.city} />
                <InfoRow label="Kecamatan" value={selected.district} />
                <InfoRow label="Desa" value={selected.village} />
                <InfoRow label="Alamat" value={selected.address} />
                <InfoRow label="Nomor Badan Hukum" value={selected.legal_number} />
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={STATUS_COLORS[selected.status] || ''}>
                    {STATUS_LABELS[selected.status] || selected.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Data koperasi belum tersedia.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-info" />
              <CardTitle className="text-base">Informasi Sistem</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="Versi Aplikasi" value="0.1.0" mono />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">Database</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">PostgreSQL</span>
                  <Badge className="bg-primary/15 text-primary">Terhubung</Badge>
                </div>
              </div>
              <InfoRow label="Server" value="Next.js" />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">Environment</span>
                <Badge variant="secondary">Development</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Pegawai / User Koperasi</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pengguna yang ditugaskan pada koperasi ini beserta jenis penugasannya.
          </p>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="p-3 text-sm text-muted-foreground">Memuat...</div>
          ) : assignments.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              Belum ada pengguna yang ditugaskan pada koperasi ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">Nama</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">Jenis Penugasan</th>
                    <th className="py-2 font-medium">Utama</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.assignment_id} className="border-b last:border-0">
                      <td className="py-2">{a.user.name}</td>
                      <td className="py-2 text-muted-foreground">{a.user.email}</td>
                      <td className="py-2">
                        {a.user.roles.map((r) => (
                          <Badge key={r.id} variant="secondary" className="mr-1">
                            {r.name}
                          </Badge>
                        ))}
                      </td>
                      <td className="py-2">{ASSIGNMENT_LABELS[a.assignment_type] || a.assignment_type}</td>
                      <td className="py-2">
                        {a.is_primary ? (
                          <Badge className="bg-warning/20 text-[#8A6414]">Utama</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2">
                        <Badge
                          className={
                            a.status === 'AKTIF'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {a.status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>
        {value || '-'}
      </span>
    </div>
  )
}
