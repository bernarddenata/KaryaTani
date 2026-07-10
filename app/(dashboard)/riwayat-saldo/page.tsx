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
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDateTime, MUTATION_TYPE_LABELS,
} from '@/lib/utils/format'
import { Download } from 'lucide-react'

interface MutationRecord {
  id: string
  mutation_type: string
  amount_in: string
  amount_out: string
  balance_before: string
  balance_after: string
  notes?: string
  created_at: string
  farmer?: { id: string; name: string }
}

interface Farmer {
  id: string
  name: string
  farmer_number: string
}

function exportCsv(columns: { key: string; label: string }[], data: Record<string, string>[]) {
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
  a.download = `riwayat-saldo-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RiwayatSaldoPage() {
  const [mutations, setMutations] = useState<MutationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [farmerId, setFarmerId] = useState('')
  const [mutationType, setMutationType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    apiFetch<Farmer[]>('/api/farmers').then((res) => {
      if (res.success && res.data) {
        setFarmers(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  const fetchMutations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (farmerId && farmerId !== 'ALL') params.set('farmer_id', farmerId)
      if (mutationType && mutationType !== 'ALL') params.set('mutation_type', mutationType)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await apiFetch<{ data: MutationRecord[]; total: number }>(
        `/api/farmer-wallet-mutations?${params.toString()}`
      )
      if (res.success && res.data) {
        setMutations(res.data.data || [])
        setTotal(res.data.total || 0)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [page, farmerId, mutationType, dateFrom, dateTo])

  useEffect(() => {
    fetchMutations()
  }, [fetchMutations])

  function handleFilter() {
    setPage(1)
    fetchMutations()
  }

  function handleExportCsv() {
    const exportColumns = [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'petani', label: 'Petani' },
      { key: 'tipe', label: 'Tipe Mutasi' },
      { key: 'masuk', label: 'Masuk' },
      { key: 'keluar', label: 'Keluar' },
      { key: 'saldo_sebelum', label: 'Saldo Sebelum' },
      { key: 'saldo_sesudah', label: 'Saldo Sesudah' },
      { key: 'catatan', label: 'Catatan' },
    ]
    const exportData = mutations.map((m) => ({
      tanggal: formatDateTime(m.created_at),
      petani: m.farmer?.name || '-',
      tipe: MUTATION_TYPE_LABELS[m.mutation_type] || m.mutation_type,
      masuk: m.amount_in,
      keluar: m.amount_out,
      saldo_sebelum: m.balance_before,
      saldo_sesudah: m.balance_after,
      catatan: m.notes || '',
    }))
    exportCsv(exportColumns, exportData)
  }

  const columns: Column<MutationRecord>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDateTime(item.created_at),
    },
    {
      key: 'farmer',
      label: 'Petani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'mutation_type',
      label: 'Tipe Mutasi',
      render: (item) => (
        <Badge variant="secondary">
          {MUTATION_TYPE_LABELS[item.mutation_type] || item.mutation_type}
        </Badge>
      ),
    },
    {
      key: 'amount_in',
      label: 'Masuk',
      render: (item) => (
        <span className="text-green-700">{formatRupiah(item.amount_in)}</span>
      ),
    },
    {
      key: 'amount_out',
      label: 'Keluar',
      render: (item) => (
        <span className="text-red-700">{formatRupiah(item.amount_out)}</span>
      ),
    },
    {
      key: 'balance_before',
      label: 'Saldo Sebelum',
      render: (item) => formatRupiah(item.balance_before),
    },
    {
      key: 'balance_after',
      label: 'Saldo Sesudah',
      render: (item) => formatRupiah(item.balance_after),
    },
    {
      key: 'notes',
      label: 'Catatan',
      render: (item) => item.notes || '-',
    },
  ]

  return (
    <DashboardShell
      title="Riwayat Saldo"
      description="Lihat riwayat mutasi saldo petani dari setiap transaksi."
      permission="farmer_wallet_mutations.view"
    >
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Petani</Label>
          <Select value={farmerId || 'ALL'} onValueChange={(v) => setFarmerId(v === 'ALL' ? '' : (v ?? ''))}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Petani">
                {(v: string | null) => {
                  if (!v || v === 'ALL') return 'Semua Petani';
                  const item = farmers.find(f => f.id === v);
                  return item ? item.name : v;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Petani</SelectItem>
              {farmers.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm text-muted-foreground mb-1 block">Tipe Mutasi</Label>
          <Select value={mutationType || 'ALL'} onValueChange={(v) => setMutationType(v === 'ALL' ? '' : (v ?? ''))}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {Object.entries(MUTATION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Button onClick={handleFilter} size="sm">
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="h-4 w-4 mr-1" /> Ekspor CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mutations}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Belum ada data riwayat saldo."
      />
    </DashboardShell>
  )
}
