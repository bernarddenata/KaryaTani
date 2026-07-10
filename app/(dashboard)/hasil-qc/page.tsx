'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDate, formatDateTime, formatWeight, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'

interface PendingSale {
  id: string
  sale_number: string
  received_weight?: string | number
  status: string
  created_at: string
  farmer?: { id: string; name: string }
  commodity?: { id: string; name: string }
  cooperative?: { id: string; name: string }
}

interface QcResult {
  id: string
  final_grade_code?: string
  status: string
  submitted_at?: string
  created_at: string
  farmer_sale?: {
    id: string
    sale_number: string
  }
  farmer?: { id: string; name: string }
  cooperative?: { id: string; name: string }
  qc_template?: { id: string; name: string }
  qc_officer_user?: { id: string; name: string }
}

export default function HasilQCPage() {
  const router = useRouter()

  const [pendingData, setPendingData] = useState<PendingSale[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [startingQc, setStartingQc] = useState<string | null>(null)

  const [qcData, setQcData] = useState<QcResult[]>([])
  const [qcTotal, setQcTotal] = useState(0)
  const [qcPage, setQcPage] = useState(1)
  const [qcLoading, setQcLoading] = useState(true)

  const fetchPending = useCallback(async () => {
    setPendingLoading(true)
    try {
      const res = await apiFetch<any>(`/api/qc/pending?page=${pendingPage}&limit=20`)
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || []
        setPendingData(items)
        setPendingTotal(res.meta?.total ?? res.data.total ?? items.length)
      }
    } catch {
      // handled by empty state
    } finally {
      setPendingLoading(false)
    }
  }, [pendingPage])

  const fetchQcResults = useCallback(async () => {
    setQcLoading(true)
    try {
      const res = await apiFetch<any>(`/api/qc-results?page=${qcPage}&limit=20`)
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || []
        setQcData(items)
        setQcTotal(res.meta?.total ?? res.data.total ?? items.length)
      }
    } catch {
      // handled by empty state
    } finally {
      setQcLoading(false)
    }
  }, [qcPage])

  useEffect(() => { fetchPending() }, [fetchPending])
  useEffect(() => { fetchQcResults() }, [fetchQcResults])

  const handleStartQc = async (saleId: string) => {
    setStartingQc(saleId)
    try {
      const res = await apiFetch(`/api/qc/${saleId}/start`, { method: 'POST' })
      if (res.success) {
        toast.success('QC berhasil dimulai')
        router.push(`/hasil-qc/${saleId}`)
      } else {
        toast.error(res.error?.message || 'Gagal memulai QC')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memulai QC')
    } finally {
      setStartingQc(null)
    }
  }

  const pendingColumns: Column<PendingSale>[] = [
    { key: 'sale_number', label: 'Nomor Penjualan' },
    {
      key: 'farmer',
      label: 'Pemilik',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => item.commodity?.name || '-',
    },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'received_weight',
      label: 'Berat Diterima',
      render: (item) => formatWeight(item.received_weight),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge className={STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDate(item.created_at),
    },
  ]

  const qcColumns: Column<QcResult>[] = [
    {
      key: 'sale_number',
      label: 'Nomor Penjualan',
      render: (item) => item.farmer_sale?.sale_number || '-',
    },
    {
      key: 'farmer',
      label: 'Pemilik',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'qc_template',
      label: 'Template',
      render: (item) => item.qc_template?.name || '-',
    },
    {
      key: 'final_grade_code',
      label: 'Grade Akhir',
      render: (item) =>
        item.final_grade_code ? (
          <Badge variant="outline">{item.final_grade_code}</Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge className={STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      ),
    },
    {
      key: 'qc_officer',
      label: 'Petugas QC',
      render: (item) => item.qc_officer_user?.name || '-',
    },
    {
      key: 'submitted_at',
      label: 'Tanggal',
      render: (item) => formatDateTime(item.submitted_at || item.created_at),
    },
  ]

  return (
    <DashboardShell
      title="Quality Control"
      description="Kelola pemeriksaan kualitas hasil tani"
      permission="qc_results.view"
    >
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Menunggu QC</TabsTrigger>
          <TabsTrigger value="all">Semua Hasil QC</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DataTable
            columns={pendingColumns}
            data={pendingData}
            total={pendingTotal}
            page={pendingPage}
            loading={pendingLoading}
            onPageChange={setPendingPage}
            emptyMessage="Tidak ada penjualan yang menunggu QC."
            actions={(item) => (
              <Button
                size="sm"
                onClick={() => handleStartQc(item.id)}
                disabled={startingQc === item.id}
              >
                {startingQc === item.id ? 'Memulai...' : 'Mulai QC'}
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="all">
          <DataTable
            columns={qcColumns}
            data={qcData}
            total={qcTotal}
            page={qcPage}
            loading={qcLoading}
            onPageChange={setQcPage}
            emptyMessage="Belum ada hasil QC."
            actions={(item) => (
              <Link href={`/hasil-qc/${item.farmer_sale?.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" /> Lihat
                </Button>
              </Link>
            )}
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
