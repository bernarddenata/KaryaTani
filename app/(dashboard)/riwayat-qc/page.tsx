'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import { formatDate, formatWeight } from '@/lib/utils/format'
import { Eye, RotateCcw } from 'lucide-react'

interface Farmer {
  id: string
  name: string
  farmer_number: string
}

interface Commodity {
  id: string
  name: string
  code: string
}

interface QcHistoryItem {
  id: string
  final_grade_code?: string
  total_rejected_weight?: string | number
  notes?: string
  submitted_at?: string
  created_at: string
  farmer_sale?: {
    id: string
    sale_number: string
    batch_number?: string
    received_weight?: string | number
    commodity?: { id: string; name: string }
  }
  farmer?: { id: string; name: string }
  qc_officer_user?: { id: string; name: string }
}

const GRADE_OPTIONS = [
  { value: 'A', label: 'Grade A' },
  { value: 'B', label: 'Grade B' },
  { value: 'C', label: 'Grade C' },
  { value: 'REJECT', label: 'Reject' },
]

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  REJECT: 'bg-red-100 text-red-800',
}

export default function RiwayatQCPage() {
  const [data, setData] = useState<QcHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [filterFarmer, setFilterFarmer] = useState('')
  const [filterCommodity, setFilterCommodity] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Applied filters (only used when "Terapkan" is clicked)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})

  const fetchFilterOptions = useCallback(async () => {
    const [farmersRes, commoditiesRes] = await Promise.all([
      apiFetch<Farmer[]>('/api/farmers'),
      apiFetch<Commodity[]>('/api/commodities'),
    ])
    if (farmersRes.success && farmersRes.data) {
      const items = Array.isArray(farmersRes.data) ? farmersRes.data : []
      setFarmers(items)
    }
    if (commoditiesRes.success && commoditiesRes.data) {
      const items = Array.isArray(commoditiesRes.data) ? commoditiesRes.data : []
      setCommodities(items)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (appliedFilters.farmer_id) params.set('farmer_id', appliedFilters.farmer_id)
      if (appliedFilters.commodity_id) params.set('commodity_id', appliedFilters.commodity_id)
      if (appliedFilters.grade) params.set('grade', appliedFilters.grade)
      if (appliedFilters.date_from) params.set('date_from', appliedFilters.date_from)
      if (appliedFilters.date_to) params.set('date_to', appliedFilters.date_to)

      const res = await apiFetch<any>(`/api/qc-history?${params.toString()}`)
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || []
        setData(items)
        setTotal(res.meta?.total ?? res.data.total ?? items.length)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters])

  useEffect(() => { fetchFilterOptions() }, [fetchFilterOptions])
  useEffect(() => { fetchData() }, [fetchData])

  const handleApplyFilters = () => {
    const filters: Record<string, string> = {}
    if (filterFarmer) filters.farmer_id = filterFarmer
    if (filterCommodity) filters.commodity_id = filterCommodity
    if (filterGrade) filters.grade = filterGrade
    if (filterDateFrom) filters.date_from = filterDateFrom
    if (filterDateTo) filters.date_to = filterDateTo
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilterFarmer('')
    setFilterCommodity('')
    setFilterGrade('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setAppliedFilters({})
    setPage(1)
  }

  const truncate = (text: string | null | undefined, maxLen: number) => {
    if (!text) return '-'
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  }

  const columns: Column<QcHistoryItem>[] = [
    {
      key: 'submitted_at',
      label: 'Tanggal',
      render: (item) => formatDate(item.submitted_at),
    },
    {
      key: 'farmer',
      label: 'Pemilik Hasil Tani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => item.farmer_sale?.commodity?.name || '-',
    },
    {
      key: 'sale_number',
      label: 'Nomor Penjualan',
      render: (item) => item.farmer_sale?.sale_number || '-',
    },
    {
      key: 'batch_number',
      label: 'Batch',
      render: (item) => item.farmer_sale?.batch_number || '-',
    },
    {
      key: 'final_grade_code',
      label: 'Final Grade',
      render: (item) =>
        item.final_grade_code ? (
          <Badge className={GRADE_COLORS[item.final_grade_code] || 'bg-gray-100 text-gray-800'}>
            {item.final_grade_code}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'received_weight',
      label: 'Berat Diterima',
      render: (item) => formatWeight(item.farmer_sale?.received_weight),
    },
    {
      key: 'total_rejected_weight',
      label: 'Berat Reject',
      render: (item) => formatWeight(item.total_rejected_weight),
    },
    {
      key: 'notes',
      label: 'Catatan QC',
      render: (item) => (
        <span title={item.notes || ''}>
          {truncate(item.notes, 40)}
        </span>
      ),
    },
    {
      key: 'qc_officer',
      label: 'Petugas QC',
      render: (item) => item.qc_officer_user?.name || '-',
    },
  ]

  return (
    <DashboardShell
      title="Riwayat QC"
      description="Riwayat pemeriksaan kualitas hasil tani"
      permission="qc_results.view"
    >
      {/* Filter Section */}
      <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label className="text-sm">Petani</Label>
            <Select value={filterFarmer} onValueChange={(v) => setFilterFarmer(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua petani" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Komoditas</Label>
            <Select value={filterCommodity} onValueChange={(v) => setFilterCommodity(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua komoditas" />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Grade</Label>
            <Select value={filterGrade} onValueChange={(v) => setFilterGrade(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Dari Tanggal</Label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Sampai Tanggal</Label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleApplyFilters}>
            Terapkan
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        loading={loading}
        onPageChange={setPage}
        emptyMessage="Belum ada riwayat QC."
        actions={(item) => (
          <Link href={`/penjualan/${item.farmer_sale?.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" /> Detail
            </Button>
          </Link>
        )}
      />
    </DashboardShell>
  )
}
