'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { Check, Minus, Eye } from 'lucide-react'

interface Permission {
  id: string
  code: string
  name: string
  module: string
}

interface RolePermission {
  permission_id: string
  permission?: Permission
}

interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: string
  role_permissions?: RolePermission[]
}

export default function HakAksesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [rolesRes, permsRes] = await Promise.all([
      apiFetch('/api/roles'),
      apiFetch('/api/permissions'),
    ])
    if (rolesRes.success) {
      setRoles(rolesRes.data || [])
    }
    if (permsRes.success) {
      const permsData = permsRes.data
      if (permsData && typeof permsData === 'object' && !Array.isArray(permsData)) {
        setPermissionsByModule(permsData)
      } else if (Array.isArray(permsData)) {
        const grouped: Record<string, Permission[]> = {}
        permsData.forEach((p: Permission) => {
          const mod = p.module || 'Lainnya'
          if (!grouped[mod]) grouped[mod] = []
          grouped[mod].push(p)
        })
        setPermissionsByModule(grouped)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const roleHasPermission = (role: Role, permissionId: string): boolean => {
    return role.role_permissions?.some(
      (rp) => rp.permission_id === permissionId || rp.permission?.id === permissionId
    ) || false
  }

  const columns: Column<Role>[] = [
    { key: 'code', label: 'Kode', render: (item) => <span className="font-mono text-sm">{item.code}</span> },
    { key: 'name', label: 'Nama' },
    { key: 'description', label: 'Deskripsi', render: (item) => item.description || '-' },
    {
      key: 'role_permissions',
      label: 'Jumlah Izin',
      render: (item) => (
        <Badge variant="secondary">{item.role_permissions?.length || 0}</Badge>
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

  const modules = Object.keys(permissionsByModule).sort()

  return (
    <DashboardShell
      title="Hak Akses"
      description="Kelola peran dan hak akses pengguna di dalam sistem."
      permission="roles.view"
    >
      <div className="space-y-8">
        {/* Section 1: Daftar Peran */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Peran</h2>
          <DataTable
            columns={columns}
            data={roles}
            total={roles.length}
            page={1}
            limit={100}
            loading={loading}
            actions={(item) => (
              <Button
                variant={selectedRole?.id === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRole(selectedRole?.id === item.id ? null : item)}
              >
                <Eye className="h-4 w-4 mr-1" /> Lihat
              </Button>
            )}
            emptyMessage="Tidak ada peran."
          />
        </div>

        {/* Section 2: Matriks Hak Akses untuk Peran Terpilih */}
        {selectedRole && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hak Akses: {selectedRole.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => {
                const permsInModule = permissionsByModule[mod]
                if (!permsInModule || permsInModule.length === 0) return null

                return (
                  <Card key={mod}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium uppercase text-gray-500">
                        {mod}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {permsInModule.map((perm) => {
                          const granted = roleHasPermission(selectedRole, perm.id)
                          return (
                            <div key={perm.id} className="flex items-center gap-2 text-sm">
                              {granted ? (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              ) : (
                                <Minus className="h-4 w-4 text-gray-300 flex-shrink-0" />
                              )}
                              <span className={granted ? 'text-gray-900' : 'text-gray-400'}>
                                {perm.name || perm.code}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {!selectedRole && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Pilih peran dari tabel di atas untuk melihat detail hak akses.
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
