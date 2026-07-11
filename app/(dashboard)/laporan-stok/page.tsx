'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDate, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { useAuth } from '@/components/layout/auth-provider'
import { Download } from 'lucide-react'

interface RefEntity {
  id: string
  code: string
  name: string
}

interface LocationRef extends RefEntity {
  location_type: string
}

interface CommodityRef extends RefEntity {
  default_unit: string
}

interface BalanceRow {
  id: string
  unit: string
  quantity: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  cooperative?: RefEntity
  warehouse?: RefEntity
  location?: LocationRef
  commodity?: CommodityRef
  commodity_variant?: { id: string; name: string }
}

interface MovementRow {
  id: string
  movement_type: string
  quantity_in: string
  quantity_out: string
  balance_after: string
  unit: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  created_at: string
  cooperative?: RefEntity
  warehouse?: RefEntity
  location?: LocationRef
  commodity?: CommodityRef
  commodity_variant?: { id: string; name: string }
}

interface DeliveryRow {
  id: string
  delivery_number: string
  delivery_date: string
  destination_type: string
  destination_name: string
  quantity: string
  status: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  cooperative?: RefEntity
  warehouse?: RefEntity
  location?: LocationRef
  commodity?: CommodityRef
  commodity_variant?: { id: string; name: string }
}

interface DisposalRow {
  id: string
  disposal_number: string
  disposal_date: string
  reason: string
  quantity: string
  status: string
  grade_code?: string
  grade_name?: string
  batch_number?: string
  cooperative?: RefEntity
  warehouse?: RefEntity
  location?: LocationRef
  commodity?: CommodityRef
  commodity_variant?: { id: string; name: string }
}

type ReportRow = BalanceRow | MovementRow | DeliveryRow | DisposalRow

interface ReportSummary {
  total_rows: number
  quantity_by_unit?: Record<string, number>
  quantity_in_by_unit?: Record<string, number>
  quantity_out_by_unit?: Record<string, number>
}

type TabKind = 'balance' | 'movement' | 'delivery' | 'disposal'

interface TabConfig {
  key: string
  label: string
  endpoint: string
  dataKey: string
  kind: TabKind
}

const TABS: TabConfig[] = [
  { key: 'saat-ini', label: 'Stok Saat Ini', endpoint: '/api/reports/stock-balances', dataKey: 'balances', kind: 'balance' },
  { key: 'mutasi', label: 'Mutasi Stok', endpoint: '/api/reports/stock-movements', dataKey: 'movements', kind: 'movement' },
  { key: 'transit', label: 'Stok Transit', endpoint: '/api/reports/stock-transit', dataKey: 'balances', kind: 'balance' },
  { key: 'rusak', label: 'Stok Rusak / Ditolak', endpoint: '/api/reports/stock-bad', dataKey: 'balances', kind: 'balance' },
  { key: 'pengiriman', label: 'Pengiriman', endpoint: '/api/reports/stock-deliveries', dataKey: 'deliveries', kind: 'delivery' },
  { key: 'pemusnahan', label: 'Pemusnahan', endpoint: '/api/reports/stock-disposals', dataKey: 'disposals', kind: 'disposal' },
]

const DATED_KINDS: TabKind[] = ['movement', 'delivery', 'disposal']

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  STOK_MASUK: 'Stok Masuk',
  PINDAH_LOKASI_KELUAR: 'Pindah Lokasi (Keluar)',
  PINDAH_LOKASI_MASUK: 'Pindah Lokasi (Masuk)',
  PENYESUAIAN_TAMBAH: 'Penyesuaian Tambah',
  PENYESUAIAN_KURANG: 'Penyesuaian Kurang',
  PEMUSNAHAN_STOK: 'Pemusnahan Stok',
  PENGIRIMAN: 'Pengiriman',
  KOREKSI: 'Koreksi',
}

const DESTINATION_TYPE_LABELS: Record<string, string> = {
  PEMBELI: 'Pembeli',
  KOPERASI_LAIN: 'Koperasi Lain',
  GUDANG_LAIN: 'Gudang Lain',
  PROGRAM_PEMERINTAH: 'Program Pemerintah',
  LAINNYA: 'Lainnya',
}

function formatQty(value: string | number | null | undefined, unit?: string): string {
  const num = typeof value === 'number' ? value : parseFloat(value ?? '0')
  if (isNaN(num)) return '-'
  return `${num.toLocaleString('id-ID')} ${unit || ''}`.trim()
}

function unitTotals(map?: Record<string, number>): string {
  if (!map) return ''
  return Object.entries(map)
    .map(([unit, qty]) => `${qty.toLocaleString('id-ID')} ${unit}`)
    .join(', ')
}

function gradeLabel(row: { grade_name?: string; grade_code?: string }): string {
  return row.grade_name || row.grade_code || '-'
}

function commodityLabel(row: { commodity?: CommodityRef; commodity_variant?: { name: string } }): string {
  if (!row.commodity) return '-'
  return row.commodity_variant
    ? `${row.commodity.name} (${row.commodity_variant.name})`
    : row.commodity.name
}

function csvCell(val: unknown): string {
  if (val === null || val === undefined) return '""'
  return `"${String(val).replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [
    header.map(csvCell).join(','),
    ...rows.map((r) => r.map(csvCell).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function LaporanStokPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('saat-ini')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [cooperatives, setCooperatives] = useState<RefEntity[]>([])
  const [warehouses, setWarehouses] = useState<RefEntity[]>([])
  const [commodities, setCommodities] = useState<RefEntity[]>([])

  const [cooperativeId, setCooperativeId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [commodityId, setCommodityId] = useState('')
  const [gradeCode, setGradeCode] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const accessibleCoops = user?.accessible_cooperatives || []
  const isGlobal = user?.is_global_access || false
  const canExport = user?.permissions?.includes('stock_reports.export') || false

  const tab = TABS.find((t) => t.key === activeTab) || TABS[0]
  const isDatedTab = DATED_KINDS.includes(tab.kind)

  useEffect(() => {
    apiFetch<RefEntity[]>('/api/cooperatives').then((res) => {
      if (res.success && res.data) {
        setCooperatives(Array.isArray(res.data) ? res.data : [])
      }
    })
    apiFetch<RefEntity[]>('/api/commodities').then((res) => {
      if (res.success && res.data) {
        setCommodities(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  useEffect(() => {
    if (!isGlobal && accessibleCoops.length === 1 && !cooperativeId) {
      setCooperativeId(accessibleCoops[0].id)
    }
  }, [isGlobal, accessibleCoops, cooperativeId])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (cooperativeId) params.set('cooperative_id', cooperativeId)
    apiFetch<RefEntity[]>(`/api/warehouses?${params.toString()}`).then((res) => {
      if (res.success && res.data) {
        setWarehouses(Array.isArray(res.data) ? res.data : [])
      }
    })
    setWarehouseId('')
  }, [cooperativeId])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setRows([])
    setSummary(null)
    try {
      const params = new URLSearchParams()
      if (cooperativeId) params.set('cooperative_id', cooperativeId)
      if (warehouseId) params.set('warehouse_id', warehouseId)
      if (commodityId) params.set('commodity_id', commodityId)
      if (gradeCode.trim()) params.set('grade_code', gradeCode.trim())
      if (batchNumber.trim()) params.set('batch_number', batchNumber.trim())
      if (DATED_KINDS.includes(tab.kind)) {
        if (dateFrom) params.set('date_from', dateFrom)
        if (dateTo) params.set('date_to', dateTo)
      }

      const res = await apiFetch<Record<string, unknown>>(`${tab.endpoint}?${params.toString()}`)
      if (res.success && res.data) {
        const list = res.data[tab.dataKey]
        setRows(Array.isArray(list) ? (list as ReportRow[]) : [])
        setSummary((res.data.summary as ReportSummary) || null)
      }
    } catch {
      // ditangani oleh tampilan kosong
    } finally {
      setLoading(false)
    }
  }, [tab, cooperativeId, warehouseId, commodityId, gradeCode, batchNumber, dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const coopOptions = isGlobal
    ? cooperatives
    : cooperatives.filter((c) => accessibleCoops.some((a) => a.id === c.id))

  function handleExportCsv() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `laporan-stok-${tab.key}-${stamp}.csv`

    if (tab.kind === 'balance') {
      const data = rows as BalanceRow[]
      downloadCsv(
        filename,
        ['Koperasi', 'Gudang', 'Lokasi', 'Komoditas', 'Grade', 'Batch', 'Jumlah', 'Satuan'],
        data.map((r) => [
          r.cooperative?.name || '-',
          r.warehouse?.name || '-',
          r.location?.name || '-',
          commodityLabel(r),
          gradeLabel(r),
          r.batch_number || '-',
          r.quantity,
          r.unit,
        ])
      )
    } else if (tab.kind === 'movement') {
      const data = rows as MovementRow[]
      downloadCsv(
        filename,
        ['Tanggal', 'Tipe', 'Komoditas', 'Grade', 'Batch', 'Masuk', 'Keluar', 'Saldo Sesudah', 'Satuan', 'Gudang', 'Lokasi'],
        data.map((r) => [
          formatDateTime(r.created_at),
          MOVEMENT_TYPE_LABELS[r.movement_type] || r.movement_type,
          commodityLabel(r),
          gradeLabel(r),
          r.batch_number || '-',
          r.quantity_in,
          r.quantity_out,
          r.balance_after,
          r.unit,
          r.warehouse?.name || '-',
          r.location?.name || '-',
        ])
      )
    } else if (tab.kind === 'delivery') {
      const data = rows as DeliveryRow[]
      downloadCsv(
        filename,
        ['Nomor', 'Tanggal', 'Tujuan', 'Komoditas', 'Grade', 'Batch', 'Jumlah', 'Satuan', 'Status'],
        data.map((r) => [
          r.delivery_number,
          formatDate(r.delivery_date),
          `${DESTINATION_TYPE_LABELS[r.destination_type] || r.destination_type} - ${r.destination_name}`,
          commodityLabel(r),
          gradeLabel(r),
          r.batch_number || '-',
          r.quantity,
          r.commodity?.default_unit || '',
          STATUS_LABELS[r.status] || r.status,
        ])
      )
    } else {
      const data = rows as DisposalRow[]
      downloadCsv(
        filename,
        ['Nomor', 'Tanggal', 'Alasan', 'Komoditas', 'Grade', 'Batch', 'Jumlah', 'Satuan', 'Status'],
        data.map((r) => [
          r.disposal_number,
          formatDate(r.disposal_date),
          r.reason,
          commodityLabel(r),
          gradeLabel(r),
          r.batch_number || '-',
          r.quantity,
          r.commodity?.default_unit || '',
          STATUS_LABELS[r.status] || r.status,
        ])
      )
    }
  }

  function renderAggregate() {
    if (!summary || rows.length === 0) return null
    if (tab.kind === 'movement') {
      return (
        <p className="text-sm text-muted-foreground mb-2">
          Total Masuk: <span className="font-medium text-foreground">{unitTotals(summary.quantity_in_by_unit) || '0'}</span>
          {' '}&middot;{' '}
          Total Keluar: <span className="font-medium text-foreground">{unitTotals(summary.quantity_out_by_unit) || '0'}</span>
          {' '}&middot; {summary.total_rows.toLocaleString('id-ID')} baris
        </p>
      )
    }
    return (
      <p className="text-sm text-muted-foreground mb-2">
        Total: <span className="font-medium text-foreground">{unitTotals(summary.quantity_by_unit) || '0'}</span>
        {' '}&middot; {summary.total_rows.toLocaleString('id-ID')} baris
      </p>
    )
  }

  function renderTable() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )
    }
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-10">
          Belum ada data untuk laporan ini.
        </p>
      )
    }

    if (tab.kind === 'balance') {
      const data = rows as BalanceRow[]
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 font-medium">Koperasi</th>
              <th className="py-2 pr-3 font-medium">Gudang</th>
              <th className="py-2 pr-3 font-medium">Lokasi</th>
              <th className="py-2 pr-3 font-medium">Komoditas</th>
              <th className="py-2 pr-3 font-medium">Grade</th>
              <th className="py-2 pr-3 font-medium">Batch</th>
              <th className="py-2 font-medium text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{r.cooperative?.name || '-'}</td>
                <td className="py-2 pr-3">{r.warehouse?.name || '-'}</td>
                <td className="py-2 pr-3">{r.location?.name || '-'}</td>
                <td className="py-2 pr-3">{commodityLabel(r)}</td>
                <td className="py-2 pr-3">{gradeLabel(r)}</td>
                <td className="py-2 pr-3">{r.batch_number || '-'}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap font-medium">
                  {formatQty(r.quantity, r.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (tab.kind === 'movement') {
      const data = rows as MovementRow[]
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 font-medium">Tanggal</th>
              <th className="py-2 pr-3 font-medium">Tipe</th>
              <th className="py-2 pr-3 font-medium">Komoditas</th>
              <th className="py-2 pr-3 font-medium text-right">Masuk</th>
              <th className="py-2 pr-3 font-medium text-right">Keluar</th>
              <th className="py-2 pr-3 font-medium text-right">Saldo Sesudah</th>
              <th className="py-2 font-medium">Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                <td className="py-2 pr-3">
                  <Badge variant="secondary">
                    {MOVEMENT_TYPE_LABELS[r.movement_type] || r.movement_type}
                  </Badge>
                </td>
                <td className="py-2 pr-3">{commodityLabel(r)}</td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {parseFloat(r.quantity_in) > 0 ? (
                    <span className="text-primary">{formatQty(r.quantity_in, r.unit)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {parseFloat(r.quantity_out) > 0 ? (
                    <span className="text-destructive">{formatQty(r.quantity_out, r.unit)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap font-medium">
                  {formatQty(r.balance_after, r.unit)}
                </td>
                <td className="py-2">
                  <p>{r.warehouse?.name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{r.location?.name || '-'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (tab.kind === 'delivery') {
      const data = rows as DeliveryRow[]
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 font-medium">Nomor</th>
              <th className="py-2 pr-3 font-medium">Tanggal</th>
              <th className="py-2 pr-3 font-medium">Tujuan</th>
              <th className="py-2 pr-3 font-medium">Komoditas</th>
              <th className="py-2 pr-3 font-medium text-right">Jumlah</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium whitespace-nowrap">{r.delivery_number}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{formatDate(r.delivery_date)}</td>
                <td className="py-2 pr-3">
                  <p>{r.destination_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DESTINATION_TYPE_LABELS[r.destination_type] || r.destination_type}
                  </p>
                </td>
                <td className="py-2 pr-3">{commodityLabel(r)}</td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                  {formatQty(r.quantity, r.commodity?.default_unit)}
                </td>
                <td className="py-2">
                  <Badge className={STATUS_COLORS[r.status] || ''}>
                    {STATUS_LABELS[r.status] || r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const data = rows as DisposalRow[]
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-3 font-medium">Nomor</th>
            <th className="py-2 pr-3 font-medium">Tanggal</th>
            <th className="py-2 pr-3 font-medium">Alasan</th>
            <th className="py-2 pr-3 font-medium">Komoditas</th>
            <th className="py-2 pr-3 font-medium text-right">Jumlah</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-3 font-medium whitespace-nowrap">{r.disposal_number}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{formatDate(r.disposal_date)}</td>
              <td className="py-2 pr-3 max-w-[260px]">
                <span className="truncate block" title={r.reason}>{r.reason}</span>
              </td>
              <td className="py-2 pr-3">{commodityLabel(r)}</td>
              <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                {formatQty(r.quantity, r.commodity?.default_unit)}
              </td>
              <td className="py-2">
                <Badge className={STATUS_COLORS[r.status] || ''}>
                  {STATUS_LABELS[r.status] || r.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <DashboardShell
      title="Laporan Stok"
      description="Ringkasan stok saat ini, mutasi, pengiriman, dan pemusnahan."
      permission="stock_reports.view"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={t.key === activeTab ? 'default' : 'outline'}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        {(isGlobal || accessibleCoops.length > 1) && (
          <div className="w-56">
            <Label className="text-sm text-muted-foreground mb-1 block">Koperasi</Label>
            <Select
              value={cooperativeId || 'ALL'}
              onValueChange={(v) => setCooperativeId(v === 'ALL' ? '' : (v ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Koperasi">
                  {(v: string | null) => {
                    if (!v || v === 'ALL') return 'Semua Koperasi'
                    const item = coopOptions.find((c) => c.id === v)
                    return item ? `${item.code} - ${item.name}` : v
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Koperasi</SelectItem>
                {coopOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Gudang</Label>
          <Select
            value={warehouseId || 'ALL'}
            onValueChange={(v) => setWarehouseId(v === 'ALL' ? '' : (v ?? ''))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Gudang">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Gudang'
                  const item = warehouses.find((w) => w.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Gudang</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Komoditas</Label>
          <Select
            value={commodityId || 'ALL'}
            onValueChange={(v) => setCommodityId(v === 'ALL' ? '' : (v ?? ''))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Komoditas">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Komoditas'
                  const item = commodities.find((c) => c.id === v)
                  return item ? item.name : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Komoditas</SelectItem>
              {commodities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Grade</Label>
          <Input
            value={gradeCode}
            onChange={(e) => setGradeCode(e.target.value)}
            placeholder="Mis. A"
            className="w-24"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Batch</Label>
          <Input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="Nomor batch"
            className="w-36"
          />
        </div>
        {isDatedTab && (
          <>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Dari Tanggal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
          </>
        )}
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || rows.length === 0}
          >
            <Download className="h-4 w-4 mr-1" /> Unduh CSV
          </Button>
        )}
      </div>

      {!isGlobal && accessibleCoops.length === 1 && (
        <p className="text-xs text-muted-foreground mb-4">
          Data dibatasi pada koperasi: <strong>{accessibleCoops[0].name}</strong>
        </p>
      )}

      {renderAggregate()}

      <div className="overflow-x-auto rounded-lg border bg-card p-4">
        {renderTable()}
      </div>
    </DashboardShell>
  )
}
