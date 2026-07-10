'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate,
  STATUS_LABELS, STATUS_COLORS,
  DISPUTE_REASON_LABELS, PAYOUT_METHOD_LABELS,
} from '@/lib/utils/format'
import { Download } from 'lucide-react'

interface Cooperative {
  id: string
  code: string
  name: string
}

interface ReportResponse {
  summary?: Record<string, number | string>
  data?: Record<string, unknown>[]
  items?: Record<string, unknown>[]
}

function exportCsv(columns: Column<Record<string, unknown>>[], data: Record<string, unknown>[], filename: string) {
  const header = columns.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const REPORT_TABS = [
  { key: 'sales', label: 'Penjualan', endpoint: 'sales' },
  { key: 'qc', label: 'QC', endpoint: 'qc' },
  { key: 'wallets', label: 'Saldo Petani', endpoint: 'wallets' },
  { key: 'payouts', label: 'Pembayaran', endpoint: 'payouts' },
  { key: 'disputes', label: 'Keberatan', endpoint: 'disputes' },
  { key: 'commodities', label: 'Komoditas', endpoint: 'commodities' },
] as const

type ReportType = typeof REPORT_TABS[number]['key']

function getColumns(type: ReportType): Column<Record<string, unknown>>[] {
  switch (type) {
    case 'sales':
      return [
        { key: 'sale_number', label: 'No. Penjualan' },
        { key: 'farmer_name', label: 'Petani', render: (r) => (r.farmer_name as string) || (r.farmer as Record<string, string>)?.name || '-' },
        { key: 'commodity_name', label: 'Komoditas', render: (r) => (r.commodity_name as string) || '-' },
        { key: 'net_weight', label: 'Berat Bersih', render: (r) => r.net_weight ? `${r.net_weight} kg` : '-' },
        { key: 'total_price', label: 'Total Harga', render: (r) => formatRupiah(r.total_price as string) },
        {
          key: 'status', label: 'Status', render: (r) => (
            <Badge className={STATUS_COLORS[r.status as string] || 'bg-gray-100 text-gray-800'}>
              {STATUS_LABELS[r.status as string] || (r.status as string)}
            </Badge>
          ),
        },
        { key: 'created_at', label: 'Tanggal', render: (r) => formatDate(r.created_at as string) },
      ]
    case 'qc':
      return [
        { key: 'sale_number', label: 'No. Penjualan' },
        { key: 'farmer_name', label: 'Petani', render: (r) => (r.farmer_name as string) || '-' },
        { key: 'commodity_name', label: 'Komoditas', render: (r) => (r.commodity_name as string) || '-' },
        { key: 'overall_grade', label: 'Grade', render: (r) => (r.overall_grade as string) || '-' },
        { key: 'net_weight', label: 'Berat Bersih', render: (r) => r.net_weight ? `${r.net_weight} kg` : '-' },
        {
          key: 'status', label: 'Status', render: (r) => (
            <Badge className={STATUS_COLORS[r.status as string] || 'bg-gray-100 text-gray-800'}>
              {STATUS_LABELS[r.status as string] || (r.status as string)}
            </Badge>
          ),
        },
        { key: 'created_at', label: 'Tanggal', render: (r) => formatDate(r.created_at as string) },
      ]
    case 'wallets':
      return [
        { key: 'farmer_name', label: 'Petani', render: (r) => (r.farmer_name as string) || (r.farmer as Record<string, string>)?.name || '-' },
        { key: 'cooperative_name', label: 'Koperasi', render: (r) => (r.cooperative_name as string) || '-' },
        { key: 'available_balance', label: 'Saldo Tersedia', render: (r) => formatRupiah(r.available_balance as string) },
        { key: 'held_balance', label: 'Saldo Ditahan', render: (r) => formatRupiah(r.held_balance as string) },
        { key: 'total_paid', label: 'Total Dibayar', render: (r) => formatRupiah(r.total_paid as string) },
      ]
    case 'payouts':
      return [
        { key: 'payout_number', label: 'No. Pembayaran' },
        { key: 'farmer_name', label: 'Petani', render: (r) => (r.farmer_name as string) || (r.farmer as Record<string, string>)?.name || '-' },
        { key: 'amount', label: 'Jumlah', render: (r) => formatRupiah(r.amount as string) },
        { key: 'payout_method', label: 'Metode', render: (r) => PAYOUT_METHOD_LABELS[r.payout_method as string] || (r.payout_method as string) || '-' },
        {
          key: 'status', label: 'Status', render: (r) => (
            <Badge className={STATUS_COLORS[r.status as string] || 'bg-gray-100 text-gray-800'}>
              {STATUS_LABELS[r.status as string] || (r.status as string)}
            </Badge>
          ),
        },
        { key: 'created_at', label: 'Tanggal', render: (r) => formatDate(r.created_at as string) },
      ]
    case 'disputes':
      return [
        { key: 'dispute_number', label: 'No. Keberatan' },
        { key: 'farmer_name', label: 'Petani', render: (r) => (r.farmer_name as string) || '-' },
        { key: 'sale_number', label: 'No. Penjualan', render: (r) => (r.sale_number as string) || '-' },
        { key: 'reason_category', label: 'Alasan', render: (r) => DISPUTE_REASON_LABELS[r.reason_category as string] || (r.reason_category as string) || '-' },
        {
          key: 'status', label: 'Status', render: (r) => (
            <Badge className={STATUS_COLORS[r.status as string] || 'bg-gray-100 text-gray-800'}>
              {STATUS_LABELS[r.status as string] || (r.status as string)}
            </Badge>
          ),
        },
        { key: 'created_at', label: 'Tanggal', render: (r) => formatDate(r.created_at as string) },
      ]
    case 'commodities':
      return [
        { key: 'commodity_name', label: 'Komoditas', render: (r) => (r.commodity_name as string) || (r.name as string) || '-' },
        { key: 'variant', label: 'Variasi', render: (r) => (r.variant as string) || '-' },
        { key: 'total_transactions', label: 'Total Transaksi', render: (r) => String(r.total_transactions ?? r.count ?? 0) },
        { key: 'total_weight', label: 'Total Berat', render: (r) => r.total_weight ? `${r.total_weight} kg` : '-' },
        { key: 'total_value', label: 'Total Nilai', render: (r) => formatRupiah(r.total_value as string) },
        { key: 'avg_price_per_kg', label: 'Rata-rata Harga/Kg', render: (r) => formatRupiah(r.avg_price_per_kg as string) },
      ]
    default:
      return []
  }
}

function getSummaryLabels(type: ReportType): Record<string, string> {
  switch (type) {
    case 'sales':
      return { total_count: 'Total Penjualan', total_amount: 'Total Nilai', total_weight: 'Total Berat (kg)' }
    case 'qc':
      return { total_count: 'Total QC', passed: 'Lolos QC', failed: 'Tidak Lolos' }
    case 'wallets':
      return { total_count: 'Total Dompet', total_balance: 'Total Saldo', total_held: 'Total Ditahan' }
    case 'payouts':
      return { total_count: 'Total Pembayaran', total_amount: 'Total Dibayar', pending: 'Menunggu' }
    case 'disputes':
      return { total_count: 'Total Keberatan', resolved: 'Selesai', pending: 'Dalam Proses' }
    case 'commodities':
      return { total_count: 'Total Komoditas', total_weight: 'Total Berat (kg)', total_value: 'Total Nilai' }
    default:
      return {}
  }
}

function ReportTab({ type, cooperatives }: { type: ReportType; cooperatives: Cooperative[] }) {
  const tab = REPORT_TABS.find((t) => t.key === type)!
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [summary, setSummary] = useState<Record<string, number | string>>({})
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cooperativeId, setCooperativeId] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (cooperativeId && cooperativeId !== 'ALL') params.set('cooperative_id', cooperativeId)

      const res = await apiFetch<ReportResponse>(
        `/api/reports/${tab.endpoint}?${params.toString()}`
      )
      if (res.success && res.data) {
        const resData = res.data
        setData(resData.data || resData.items || [])
        setSummary(resData.summary || {})
        setTotal(res.meta?.total ?? (resData.data || resData.items || []).length)
      }
    } catch {
      setData([])
      setSummary({})
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, cooperativeId, tab.endpoint])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleFilter = () => {
    setPage(1)
    fetchReport()
  }

  const columns = getColumns(type)
  const summaryLabels = getSummaryLabels(type)

  const handleExport = () => {
    exportCsv(columns, data, `laporan-${tab.endpoint}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Dari</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Sampai</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        {cooperatives.length > 0 && (
          <div className="w-52">
            <Label className="text-sm text-muted-foreground mb-1 block">Koperasi</Label>
            <Select
              value={cooperativeId || 'ALL'}
              onValueChange={(v) => setCooperativeId(v === 'ALL' ? '' : (v ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Koperasi">
                  {(v: string | null) => {
                    if (!v || v === 'ALL') return 'Semua Koperasi';
                    const item = cooperatives.find(c => c.id === v);
                    return item ? item.name : v;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Koperasi</SelectItem>
                {cooperatives.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={handleFilter} size="sm">
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Ekspor CSV
        </Button>
      </div>

      {/* Summary Stats */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(summaryLabels).map(([key, label]) => {
            const value = summary[key]
            if (value === undefined) return null
            const isAmount = key.includes('amount') || key.includes('balance') || key.includes('held') || key.includes('value')
            return (
              <Card key={key}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">
                    {isAmount ? formatRupiah(value) : String(value)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={setPage}
        emptyMessage="Belum ada data laporan."
      />
    </div>
  )
}

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('sales')
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])

  useEffect(() => {
    apiFetch<Cooperative[]>('/api/cooperatives').then((res) => {
      if (res.success && res.data) {
        setCooperatives(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  return (
    <DashboardShell
      title="Laporan"
      description="Akses laporan ringkasan transaksi, QC, dan keuangan koperasi."
      permission="reports.view"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab((v ?? 'sales') as ReportType)}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {REPORT_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {REPORT_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <ReportTab type={tab.key} cooperatives={cooperatives} />
          </TabsContent>
        ))}
      </Tabs>
    </DashboardShell>
  )
}
