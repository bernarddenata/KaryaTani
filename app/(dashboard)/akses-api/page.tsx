'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { apiFetch } from '@/lib/utils/api-client'
import { BookOpen, FileJson, Activity, ExternalLink } from 'lucide-react'

interface EndpointGroup {
  label: string
  endpoints: { method: string; path: string; description: string }[]
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-primary/15 text-primary',
  POST: 'bg-blue-100 text-blue-800',
  PATCH: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
}

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    label: 'Autentikasi',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'Login pengguna' },
      { method: 'POST', path: '/api/auth/logout', description: 'Logout pengguna' },
      { method: 'GET', path: '/api/auth/me', description: 'Profil pengguna aktif' },
    ],
  },
  {
    label: 'Koperasi',
    endpoints: [
      { method: 'GET', path: '/api/cooperatives', description: 'Daftar koperasi' },
      { method: 'POST', path: '/api/cooperatives', description: 'Tambah koperasi' },
      { method: 'GET', path: '/api/cooperatives/{id}', description: 'Detail koperasi' },
      { method: 'PATCH', path: '/api/cooperatives/{id}', description: 'Perbarui koperasi' },
    ],
  },
  {
    label: 'Petani',
    endpoints: [
      { method: 'GET', path: '/api/farmers', description: 'Daftar petani' },
      { method: 'POST', path: '/api/farmers', description: 'Tambah petani' },
      { method: 'GET', path: '/api/farmers/{id}', description: 'Detail petani' },
      { method: 'PATCH', path: '/api/farmers/{id}', description: 'Perbarui petani' },
    ],
  },
  {
    label: 'Pengantar',
    endpoints: [
      { method: 'GET', path: '/api/farmer-representatives', description: 'Daftar pengantar' },
      { method: 'POST', path: '/api/farmer-representatives', description: 'Tambah pengantar' },
      { method: 'GET', path: '/api/farmer-representatives/{id}', description: 'Detail pengantar' },
      { method: 'PATCH', path: '/api/farmer-representatives/{id}', description: 'Perbarui pengantar' },
    ],
  },
  {
    label: 'Komoditas',
    endpoints: [
      { method: 'GET', path: '/api/commodities', description: 'Daftar komoditas' },
      { method: 'POST', path: '/api/commodities', description: 'Tambah komoditas' },
      { method: 'GET', path: '/api/commodities/{id}', description: 'Detail komoditas' },
      { method: 'PATCH', path: '/api/commodities/{id}', description: 'Perbarui komoditas' },
      { method: 'GET', path: '/api/commodities/{id}/variants', description: 'Daftar varian komoditas' },
    ],
  },
  {
    label: 'Daftar Harga',
    endpoints: [
      { method: 'GET', path: '/api/price-lists', description: 'Daftar harga' },
      { method: 'POST', path: '/api/price-lists', description: 'Tambah daftar harga' },
      { method: 'GET', path: '/api/price-lists/{id}', description: 'Detail daftar harga' },
      { method: 'GET', path: '/api/price-lists/{id}/items', description: 'Item daftar harga' },
    ],
  },
  {
    label: 'Template QC',
    endpoints: [
      { method: 'GET', path: '/api/qc-templates', description: 'Daftar template QC' },
      { method: 'POST', path: '/api/qc-templates', description: 'Tambah template QC' },
      { method: 'GET', path: '/api/qc-templates/{id}', description: 'Detail template QC' },
      { method: 'GET', path: '/api/qc-templates/{id}/items', description: 'Item template QC' },
    ],
  },
  {
    label: 'Penjualan',
    endpoints: [
      { method: 'GET', path: '/api/farmer-sales', description: 'Daftar penjualan' },
      { method: 'POST', path: '/api/farmer-sales', description: 'Tambah penjualan' },
      { method: 'GET', path: '/api/farmer-sales/{id}', description: 'Detail penjualan' },
      { method: 'POST', path: '/api/farmer-sales/{id}/cancel', description: 'Batalkan penjualan' },
      { method: 'GET', path: '/api/farmer-sales/{id}/photos', description: 'Foto penjualan' },
      { method: 'GET', path: '/api/farmer-sales/{id}/timeline', description: 'Timeline penjualan' },
      { method: 'POST', path: '/api/farmer-sales/calculate-price', description: 'Hitung harga' },
    ],
  },
  {
    label: 'QC',
    endpoints: [
      { method: 'GET', path: '/api/qc/pending', description: 'Daftar QC menunggu' },
      { method: 'POST', path: '/api/qc/start', description: 'Mulai proses QC' },
      { method: 'POST', path: '/api/qc/submit', description: 'Submit hasil QC' },
      { method: 'GET', path: '/api/qc/results', description: 'Hasil QC' },
      { method: 'GET', path: '/api/qc/history', description: 'Riwayat QC' },
    ],
  },
  {
    label: 'Saldo',
    endpoints: [
      { method: 'GET', path: '/api/farmer-wallets', description: 'Daftar saldo petani' },
      { method: 'GET', path: '/api/farmer-wallets/{id}/mutations', description: 'Mutasi saldo' },
    ],
  },
  {
    label: 'Pembayaran',
    endpoints: [
      { method: 'GET', path: '/api/farmer-payouts', description: 'Daftar pembayaran' },
      { method: 'POST', path: '/api/farmer-payouts', description: 'Buat pembayaran' },
    ],
  },
  {
    label: 'Keberatan',
    endpoints: [
      { method: 'GET', path: '/api/disputes', description: 'Daftar keberatan' },
      { method: 'POST', path: '/api/disputes', description: 'Ajukan keberatan' },
      { method: 'POST', path: '/api/disputes/{id}/review', description: 'Review keberatan' },
      { method: 'POST', path: '/api/disputes/{id}/resolve', description: 'Selesaikan keberatan' },
    ],
  },
  {
    label: 'Batch',
    endpoints: [
      { method: 'GET', path: '/api/batch/{batchNumber}', description: 'Detail batch' },
    ],
  },
  {
    label: 'Laporan',
    endpoints: [
      { method: 'GET', path: '/api/reports/*', description: 'Endpoint laporan' },
    ],
  },
  {
    label: 'File',
    endpoints: [
      { method: 'POST', path: '/api/files/upload', description: 'Upload file' },
      { method: 'GET', path: '/api/files/{id}', description: 'Ambil file' },
    ],
  },
  {
    label: 'Audit',
    endpoints: [
      { method: 'GET', path: '/api/audit-logs', description: 'Catatan audit' },
    ],
  },
]

export default function AksesAPIPage() {
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      setHealthLoading(true)
      try {
        const res = await apiFetch('/api/health')
        setHealthOk(!!res.success)
      } catch {
        setHealthOk(false)
      }
      setHealthLoading(false)
    }
    checkHealth()
  }, [])

  return (
    <DashboardShell
      title="Akses API"
      description="Dokumentasi dan informasi endpoint API sistem Karya Tani Center."
      permission="api_access.view"
    >
      <div className="space-y-8">
        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Dokumentasi API</CardTitle>
              </div>
              <CardDescription>
                Dokumentasi interaktif berbasis Swagger UI untuk menjelajahi dan menguji endpoint API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Buka Swagger UI <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base">OpenAPI JSON</CardTitle>
              </div>
              <CardDescription>
                Spesifikasi OpenAPI dalam format JSON yang dapat dibaca oleh mesin untuk integrasi otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline"
              >
                Lihat OpenAPI JSON <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Status API</CardTitle>
              </div>
              <CardDescription>
                Status kesehatan server API saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <span className="text-sm text-muted-foreground">Memeriksa...</span>
              ) : healthOk ? (
                <Badge className="bg-primary/15 text-primary">Aktif - Server Berjalan</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Tidak Tersedia</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Groups */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Endpoint API</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ENDPOINT_GROUPS.map((group) => (
              <Card key={group.label}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.endpoints.map((ep, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Badge className={`${METHOD_COLORS[ep.method] || ''} font-mono text-xs flex-shrink-0 min-w-[52px] justify-center`}>
                          {ep.method}
                        </Badge>
                        <span className="font-mono text-gray-700 break-all">{ep.path}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Note */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-4">
            <p className="text-sm text-blue-800">
              API ini akan digunakan oleh aplikasi Mobile QC Koperasi dan Mobile Petani di fase selanjutnya.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
