'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, Column } from '@/components/shared/data-table'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate, formatDateTime,
  STATUS_LABELS, STATUS_COLORS, SELLER_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS,
} from '@/lib/utils/format'
import { ArrowLeft } from 'lucide-react'

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
  verification_status: string
  status: string
  created_at: string
  updated_at: string
  cooperative?: { id: string; code: string; name: string }
  representatives?: Representative[]
}

interface Representative {
  id: string
  name: string
  phone?: string
  relationship_type: string
  identity_number?: string
  status: string
}

interface Wallet {
  id: string
  cooperative_id: string
  available_balance: string
  held_balance: string
  total_paid: string
  cooperative?: { id: string; name: string }
}

interface Sale {
  id: string
  sale_number: string
  batch_number: string
  initial_weight?: string
  received_weight?: string
  total_amount?: string
  status: string
  created_at: string
  commodity?: { id: string; code: string; name: string }
  commodity_variant?: { id: string; code: string; name: string }
  representative?: { id: string; name: string }
}

interface QcResult {
  id: string
  recommended_grade_code?: string
  final_grade_code?: string
  total_weight_checked?: string
  final_accepted_weight?: string
  total_rejected_weight?: string
  status: string
  created_at: string
  farmer_sale?: { id: string; sale_number: string; batch_number: string }
}

export default function PetaniDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [qcResults, setQcResults] = useState<QcResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmerRes, walletRes, salesRes, qcRes] = await Promise.all([
        apiFetch<Farmer>(`/api/farmers/${id}`),
        apiFetch<Wallet[]>(`/api/farmers/${id}/wallet`),
        apiFetch<Sale[]>(`/api/farmers/${id}/sales`),
        apiFetch<QcResult[]>(`/api/farmers/${id}/qc-history`),
      ])
      if (farmerRes.success && farmerRes.data) setFarmer(farmerRes.data)
      if (walletRes.success && walletRes.data) setWallets(Array.isArray(walletRes.data) ? walletRes.data : [walletRes.data])
      if (salesRes.success && salesRes.data) setSales(Array.isArray(salesRes.data) ? salesRes.data : [])
      if (qcRes.success && qcRes.data) setQcResults(Array.isArray(qcRes.data) ? qcRes.data : [])
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  const representativeColumns: Column<Representative>[] = [
    { key: 'name', label: 'Nama' },
    { key: 'phone', label: 'Nomor HP', render: (r) => r.phone || '-' },
    {
      key: 'relationship_type',
      label: 'Hubungan',
      render: (r) => RELATIONSHIP_TYPE_LABELS[r.relationship_type] || r.relationship_type,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge className={STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[r.status] || r.status}
        </Badge>
      ),
    },
  ]

  const saleColumns: Column<Sale>[] = [
    { key: 'sale_number', label: 'No. Penjualan' },
    { key: 'batch_number', label: 'Batch' },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (s) => s.commodity?.name || '-',
    },
    {
      key: 'initial_weight',
      label: 'Berat Awal',
      render: (s) => s.initial_weight ? `${s.initial_weight} kg` : '-',
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (s) => s.total_amount ? formatRupiah(s.total_amount) : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => (
        <Badge className={STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[s.status] || s.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (s) => formatDate(s.created_at),
    },
  ]

  const qcColumns: Column<QcResult>[] = [
    {
      key: 'sale_number',
      label: 'No. Penjualan',
      render: (q) => q.farmer_sale?.sale_number || '-',
    },
    {
      key: 'recommended_grade_code',
      label: 'Grade Rekomendasi',
      render: (q) => q.recommended_grade_code || '-',
    },
    {
      key: 'final_grade_code',
      label: 'Grade Final',
      render: (q) => q.final_grade_code || '-',
    },
    {
      key: 'total_weight_checked',
      label: 'Berat Diperiksa',
      render: (q) => q.total_weight_checked ? `${q.total_weight_checked} kg` : '-',
    },
    {
      key: 'final_accepted_weight',
      label: 'Berat Diterima',
      render: (q) => q.final_accepted_weight ? `${q.final_accepted_weight} kg` : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (q) => (
        <Badge className={STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[q.status] || q.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (q) => formatDate(q.created_at),
    },
  ]

  return (
    <DashboardShell title="Detail Petani" description="Informasi lengkap data petani beserta riwayat transaksi." permission="farmers.view">
      <div className="mb-4">
        <Link href="/petani">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        </div>
      ) : !farmer ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data petani tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>{farmer.name}</CardTitle>
              <p className="text-sm text-gray-500">{farmer.farmer_number}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Koperasi</p>
                  <p className="font-medium">{farmer.cooperative?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nomor HP</p>
                  <p className="font-medium">{farmer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">NIK</p>
                  <p className="font-medium">{farmer.nik || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desa</p>
                  <p className="font-medium">{farmer.village || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alamat</p>
                  <p className="font-medium">{farmer.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipe Penjual</p>
                  <p className="font-medium">{SELLER_TYPE_LABELS[farmer.seller_type] || farmer.seller_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status Verifikasi</p>
                  <Badge className={STATUS_COLORS[farmer.verification_status] || 'bg-gray-100 text-gray-800'}>
                    {STATUS_LABELS[farmer.verification_status] || farmer.verification_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={STATUS_COLORS[farmer.status] || 'bg-gray-100 text-gray-800'}>
                    {STATUS_LABELS[farmer.status] || farmer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Terdaftar</p>
                  <p className="font-medium">{formatDate(farmer.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle>Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              {wallets.length === 0 ? (
                <p className="text-gray-500">Belum ada data saldo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wallets.map((wallet) => (
                    <Card key={wallet.id} className="border">
                      <CardContent className="pt-4">
                        {wallet.cooperative && (
                          <p className="text-sm text-gray-500 mb-2">{wallet.cooperative.name}</p>
                        )}
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Saldo Tersedia</p>
                            <p className="text-lg font-semibold text-green-700">{formatRupiah(wallet.available_balance)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Saldo Ditahan</p>
                            <p className="font-medium">{formatRupiah(wallet.held_balance)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Dibayar</p>
                            <p className="font-medium">{formatRupiah(wallet.total_paid)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="pengantar">
            <TabsList>
              <TabsTrigger value="pengantar">Pengantar</TabsTrigger>
              <TabsTrigger value="penjualan">Riwayat Penjualan</TabsTrigger>
              <TabsTrigger value="qc">Riwayat QC</TabsTrigger>
            </TabsList>

            <TabsContent value="pengantar" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pengantar</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={representativeColumns}
                    data={farmer.representatives || []}
                    total={farmer.representatives?.length || 0}
                    emptyMessage="Belum ada data pengantar."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="penjualan" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={saleColumns}
                    data={sales}
                    total={sales.length}
                    emptyMessage="Belum ada riwayat penjualan."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qc" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat QC</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={qcColumns}
                    data={qcResults}
                    total={qcResults.length}
                    emptyMessage="Belum ada riwayat QC."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardShell>
  )
}
