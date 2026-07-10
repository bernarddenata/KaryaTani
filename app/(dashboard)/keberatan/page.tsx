'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatDate,
  STATUS_LABELS, STATUS_COLORS, DISPUTE_REASON_LABELS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface Dispute {
  id: string
  dispute_number: string
  reason_category: string
  status: string
  notes?: string
  created_at: string
  farmer?: { id: string; name: string }
  farmer_sale?: { id: string; sale_number: string }
}

interface FarmerSale {
  id: string
  sale_number: string
  farmer?: { id: string; name: string }
  status: string
  created_at: string
}

export default function KeberatanPage() {
  const [data, setData] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [sales, setSales] = useState<FarmerSale[]>([])
  const [salesLoading, setSalesLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [reasonCategory, setReasonCategory] = useState('')
  const [notes, setNotes] = useState('')

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await apiFetch(`/api/disputes?${params.toString()}`)
      if (res.success) {
        setData(Array.isArray(res.data) ? res.data : res.data?.items || [])
        setTotal(res.meta?.total ?? res.data?.length ?? 0)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  const openCreate = async () => {
    setSelectedSaleId('')
    setReasonCategory('')
    setNotes('')
    setDialogOpen(true)
    setSalesLoading(true)
    try {
      const res = await apiFetch<FarmerSale[]>('/api/farmer-sales?limit=50')
      if (res.success && res.data) {
        setSales(Array.isArray(res.data) ? res.data : [])
      }
    } catch {
      setSales([])
    } finally {
      setSalesLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSaleId || !reasonCategory) {
      toast.error('Lengkapi semua field yang diperlukan')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/disputes', {
        method: 'POST',
        body: {
          farmer_sale_id: selectedSaleId,
          reason_category: reasonCategory,
          notes: notes || undefined,
        },
      })
      if (res.success) {
        toast.success('Keberatan berhasil dibuat')
        setDialogOpen(false)
        fetchDisputes()
      } else {
        toast.error(res.error?.message || 'Gagal membuat keberatan')
      }
    } catch {
      toast.error('Terjadi kesalahan saat membuat keberatan')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Dispute>[] = [
    {
      key: 'dispute_number',
      label: 'Nomor Keberatan',
    },
    {
      key: 'farmer',
      label: 'Petani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'farmer_sale',
      label: 'Nomor Penjualan',
      render: (item) => item.farmer_sale?.sale_number || '-',
    },
    {
      key: 'reason_category',
      label: 'Alasan',
      render: (item) => (
        <Badge variant="secondary">
          {DISPUTE_REASON_LABELS[item.reason_category] || item.reason_category}
        </Badge>
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
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDate(item.created_at),
    },
  ]

  return (
    <DashboardShell
      title="Keberatan"
      description="Kelola keberatan yang diajukan petani terkait hasil QC atau pembayaran."
      permission="disputes.view"
    >
      <div className="flex items-center justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Buat Keberatan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        loading={loading}
        onPageChange={setPage}
        actions={(item) => (
          <Link href={`/keberatan/${item.id}`}>
            <Button variant="ghost" size="sm">
              Detail
            </Button>
          </Link>
        )}
        emptyMessage="Belum ada data keberatan."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Keberatan</DialogTitle>
            <DialogDescription>
              Ajukan keberatan terkait hasil QC atau pembayaran dari penjualan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sale_id">Penjualan</Label>
              {salesLoading ? (
                <p className="text-sm text-muted-foreground">Memuat data penjualan...</p>
              ) : (
                <Select
                  value={selectedSaleId || 'NONE'}
                  onValueChange={(v) => setSelectedSaleId(v === 'NONE' ? '' : (v ?? ''))}
                >
                  <SelectTrigger id="sale_id">
                    <SelectValue placeholder="Pilih penjualan">
                      {(v: string | null) => {
                        if (!v || v === 'NONE') return 'Pilih penjualan';
                        const item = sales.find(s => s.id === v);
                        return item ? `${item.sale_number} - ${item.farmer?.name || 'Tanpa nama'}` : v;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" disabled>Pilih penjualan</SelectItem>
                    {sales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.sale_number} - {s.farmer?.name || 'Tanpa nama'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason_category">Kategori Alasan</Label>
              <Select
                value={reasonCategory || 'NONE'}
                onValueChange={(v) => setReasonCategory(v === 'NONE' ? '' : (v ?? ''))}
              >
                <SelectTrigger id="reason_category">
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" disabled>Pilih alasan</SelectItem>
                  {Object.entries(DISPUTE_REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan Keberatan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jelaskan detail keberatan Anda..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !selectedSaleId || !reasonCategory}
            >
              {saving ? 'Menyimpan...' : 'Kirim Keberatan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
