'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/utils/api-client'
import { formatRupiah, formatWeight, formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingCart, Scale, ClipboardCheck, CheckCircle, AlertTriangle, Clock, Banknote, Wallet } from 'lucide-react'

interface SalesReport {
  summary?: { total_count?: number; total_weight?: number | string; total_amount?: number | string }
  sales?: Array<{
    sale_number?: string
    farmer?: { name?: string }
    commodity?: { name?: string; code?: string }
    received_weight?: number | string
    total_amount?: number | string
    status?: string
    created_at?: string
  }>
}

interface QcReport {
  summary?: { total_count?: number }
}

interface WalletsReport {
  summary?: { total_wallets?: number; total_available?: number | string; total_held?: number | string; total_paid?: number | string }
}

interface DisputesReport {
  disputes?: Array<{ status?: string }>
  summary?: { by_status?: Array<{ status: string; count: number }>; total?: number }
}

type CommodityItem = {
  commodity?: { name?: string; code?: string }
  total_weight?: number | string
  total_amount?: number | string
  total_sales?: number
}

interface PayoutsResponse {
  data?: any[]
  meta?: { total?: number }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [salesToday, setSalesToday] = useState<SalesReport>({})
  const [salesAll, setSalesAll] = useState<SalesReport>({})
  const [qcReport, setQcReport] = useState<QcReport>({})
  const [walletsReport, setWalletsReport] = useState<WalletsReport>({})
  const [disputesReport, setDisputesReport] = useState<DisputesReport>({})
  const [commoditiesData, setCommoditiesData] = useState<CommodityItem[]>([])
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().slice(0, 10)

        const [
          salesTodayRes,
          salesAllRes,
          qcRes,
          walletsRes,
          disputesRes,
          commoditiesRes,
          payoutsRes,
        ] = await Promise.all([
          apiFetch<SalesReport>(`/api/reports/sales?date_from=${today}&date_to=${today}`),
          apiFetch<SalesReport>(`/api/reports/sales?date_from=&date_to=`),
          apiFetch<QcReport>(`/api/reports/qc?date_from=${today}&date_to=${today}`),
          apiFetch<WalletsReport>(`/api/reports/wallets`),
          apiFetch<DisputesReport>(`/api/reports/disputes`),
          apiFetch<CommodityItem[]>(`/api/reports/commodities`),
          apiFetch<PayoutsResponse>(`/api/farmer-payouts?status=BELUM_DIBAYAR`),
        ])

        if (salesTodayRes.success && salesTodayRes.data) setSalesToday(salesTodayRes.data)
        if (salesAllRes.success && salesAllRes.data) setSalesAll(salesAllRes.data)
        if (qcRes.success && qcRes.data) setQcReport(qcRes.data)
        if (walletsRes.success && walletsRes.data) setWalletsReport(walletsRes.data)
        if (disputesRes.success && disputesRes.data) setDisputesReport(disputesRes.data)
        if (commoditiesRes.success && commoditiesRes.data) {
          const arr = Array.isArray(commoditiesRes.data) ? commoditiesRes.data : []
          setCommoditiesData(arr)
        }
        if (payoutsRes.success) {
          setPendingPayoutsCount(payoutsRes.meta?.total ?? (Array.isArray(payoutsRes.data) ? payoutsRes.data.length : 0))
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const activeDisputes = (disputesReport.disputes ?? []).filter(
    (d) => d.status === 'DIKIRIM' || d.status === 'DALAM_REVIEW'
  ).length

  const waitingQcCount = (salesAll.sales ?? []).filter(
    (s) => s.status === 'MENUNGGU_QC'
  ).length

  const commodityData = commoditiesData.map((c) => ({
    name: c.commodity?.name ?? '',
    weight: Number(c.total_weight ?? 0),
  }))

  const disputesByStatus: Record<string, number> = {}
  for (const d of disputesReport.disputes ?? []) {
    const status = d.status ?? 'UNKNOWN'
    disputesByStatus[status] = (disputesByStatus[status] ?? 0) + 1
  }

  const stats = [
    {
      label: 'Penjualan Hari Ini',
      value: String(salesToday.summary?.total_count ?? 0),
      icon: ShoppingCart,
      bgColor: 'bg-cyan-50',
      textColor: 'text-[#065366]',
    },
    {
      label: 'Total Berat Diterima',
      value: formatWeight(salesToday.summary?.total_weight ?? 0),
      icon: Scale,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
    },
    {
      label: 'Menunggu QC',
      value: String(waitingQcCount),
      icon: ClipboardCheck,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'QC Selesai',
      value: String(qcReport.summary?.total_count ?? 0),
      icon: CheckCircle,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
    },
    {
      label: 'Keberatan Aktif',
      value: String(activeDisputes),
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      label: 'Menunggu Pembayaran',
      value: String(pendingPayoutsCount),
      icon: Clock,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Saldo Belum Dibayar',
      value: formatRupiah(walletsReport.summary?.total_available ?? 0),
      icon: Wallet,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Total Nilai Hari Ini',
      value: formatRupiah(salesToday.summary?.total_amount ?? 0),
      icon: Banknote,
      bgColor: 'bg-cyan-50',
      textColor: 'text-[#065366]',
    },
  ]

  const recentSales = (salesToday.sales ?? []).slice(0, 5)

  return (
    <DashboardShell
      title="Dasbor"
      description="Ringkasan aktivitas koperasi hari ini"
      permission="dashboard.view"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#065366] border-t-transparent" />
            <p className="text-sm text-gray-500">Memuat data dasbor...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Commodity Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Volume Komoditas</CardTitle>
              </CardHeader>
              <CardContent>
                {commodityData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commodityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="weight" fill="#065366" name="Berat (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                    Belum ada data komoditas
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dispute Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Keberatan</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(disputesByStatus).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(disputesByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <Badge className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}>
                          {STATUS_LABELS[status] ?? status}
                        </Badge>
                        <span className="text-lg font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                    Tidak ada keberatan
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Penjualan Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Penjualan</TableHead>
                      <TableHead>Petani</TableHead>
                      <TableHead>Komoditas</TableHead>
                      <TableHead>Berat</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale, idx) => (
                      <TableRow key={sale.sale_number ?? idx}>
                        <TableCell className="font-medium">{sale.sale_number ?? '-'}</TableCell>
                        <TableCell>{sale.farmer?.name ?? '-'}</TableCell>
                        <TableCell>{sale.commodity?.name ?? '-'}</TableCell>
                        <TableCell>{formatWeight(sale.received_weight)}</TableCell>
                        <TableCell>{formatRupiah(sale.total_amount)}</TableCell>
                        <TableCell>
                          {sale.status ? (
                            <Badge className={STATUS_COLORS[sale.status] ?? 'bg-gray-100 text-gray-800'}>
                              {STATUS_LABELS[sale.status] ?? sale.status}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(sale.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                  Belum ada penjualan hari ini
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  )
}
