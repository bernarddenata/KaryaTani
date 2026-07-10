'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/utils/api-client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { Building2, Server } from 'lucide-react'

interface Cooperative {
  id: string
  name: string
  code: string
  province?: string
  city?: string
  district?: string
  village?: string
  address?: string
  legal_entity_number?: string
  status: string
}

export default function PengaturanPage() {
  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const res = await apiFetch('/api/cooperatives')
      if (res.success && res.data) {
        const coopData = Array.isArray(res.data) ? res.data[0] : res.data
        if (coopData) setCooperative(coopData)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardShell
        title="Pengaturan"
        description="Konfigurasi pengaturan umum sistem koperasi."
        permission="settings.view"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065366]" />
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informasi Koperasi */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#065366]" />
              <CardTitle className="text-base">Informasi Koperasi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {cooperative ? (
              <div className="space-y-3">
                <InfoRow label="Nama Koperasi" value={cooperative.name} />
                <InfoRow label="Kode" value={cooperative.code} mono />
                <InfoRow label="Provinsi" value={cooperative.province} />
                <InfoRow label="Kota" value={cooperative.city} />
                <InfoRow label="Kecamatan" value={cooperative.district} />
                <InfoRow label="Desa" value={cooperative.village} />
                <InfoRow label="Alamat" value={cooperative.address} />
                <InfoRow label="Nomor Badan Hukum" value={cooperative.legal_entity_number} />
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={STATUS_COLORS[cooperative.status] || ''}>
                    {STATUS_LABELS[cooperative.status] || cooperative.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Data koperasi belum tersedia.</p>
            )}
          </CardContent>
        </Card>

        {/* Informasi Sistem */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
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
                  <Badge className="bg-cyan-100 text-cyan-800">Terhubung</Badge>
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
