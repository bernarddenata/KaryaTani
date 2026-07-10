'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDateTime, formatWeight,
  STATUS_LABELS, STATUS_COLORS, DISPUTE_REASON_LABELS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

interface GradeBreakdown {
  id: string
  grade_code: string
  weight: string
  price_per_kg?: string
  subtotal?: string
}

interface DisputeDetail {
  id: string
  dispute_number: string
  reason_category: string
  farmer_note: string
  status: string
  manager_decision: string | null
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
  farmer: {
    name: string
    farmer_number: string
  }
  farmer_sale: {
    sale_number: string
    batch_number: string
    total_amount: string
    received_weight: string
    commodity: { name: string }
    commodity_variant: { name: string } | null
  }
  qc_result: {
    final_grade_code: string
    grade_breakdowns: GradeBreakdown[]
  } | null
  reviewed_by: { name: string } | null
}

const DECISION_OPTIONS = [
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DITOLAK', label: 'Ditolak' },
  { value: 'PERLU_QC_ULANG', label: 'Perlu QC Ulang' },
  { value: 'SELESAI', label: 'Selesai' },
]

export default function KeberatanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Resolve form state
  const [decision, setDecision] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<DisputeDetail>(`/api/disputes/${id}`)
      if (res.success && res.data) {
        setDispute(res.data)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  const handleStartReview = async () => {
    setActionLoading(true)
    try {
      const res = await apiFetch(`/api/disputes/${id}/review`, { method: 'PATCH' })
      if (res.success) {
        toast.success('Keberatan mulai ditinjau.')
        fetchData()
      } else {
        toast.error(res.error?.message || 'Gagal memulai review.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!decision) {
      toast.error('Pilih keputusan terlebih dahulu.')
      return
    }
    setActionLoading(true)
    try {
      const body: Record<string, unknown> = {
        manager_decision: decision,
        resolution_note: resolutionNote,
      }
      if (adjustmentAmount) {
        body.adjustment_amount = parseFloat(adjustmentAmount)
      }
      const res = await apiFetch(`/api/disputes/${id}/resolve`, { method: 'PATCH', body })
      if (res.success) {
        toast.success('Keberatan berhasil diselesaikan.')
        fetchData()
      } else {
        toast.error(res.error?.message || 'Gagal menyelesaikan keberatan.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardShell
      title="Detail Keberatan"
      description="Informasi lengkap keberatan petani."
      permission="disputes.view"
    >
      <div className="mb-4">
        <Link href="/keberatan">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065366]" />
        </div>
      ) : !dispute ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data keberatan tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Dispute Info Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{dispute.dispute_number}</CardTitle>
                  <Badge className={`mt-2 ${STATUS_COLORS[dispute.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[dispute.status] || dispute.status}
                  </Badge>
                </div>
                {dispute.status === 'DIKIRIM' && (
                  <Button onClick={handleStartReview} disabled={actionLoading}>
                    {actionLoading ? 'Memproses...' : 'Mulai Review'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nomor Keberatan</p>
                  <p className="font-medium">{dispute.dispute_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={STATUS_COLORS[dispute.status] || 'bg-gray-100 text-gray-800'}>
                    {STATUS_LABELS[dispute.status] || dispute.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Alasan</p>
                  <p className="font-medium">
                    {DISPUTE_REASON_LABELS[dispute.reason_category] || dispute.reason_category}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDateTime(dispute.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Petani</p>
                  <p className="font-medium">
                    {dispute.farmer.name} ({dispute.farmer.farmer_number})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Catatan Petani */}
          <Card>
            <CardHeader>
              <CardTitle>Catatan Petani</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {dispute.farmer_note || 'Tidak ada catatan.'}
              </p>
            </CardContent>
          </Card>

          {/* Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nomor Penjualan</p>
                  <p className="font-medium">{dispute.farmer_sale.sale_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Batch</p>
                  <p className="font-medium">{dispute.farmer_sale.batch_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Komoditas</p>
                  <p className="font-medium">
                    {dispute.farmer_sale.commodity.name}
                    {dispute.farmer_sale.commodity_variant?.name &&
                      ` - ${dispute.farmer_sale.commodity_variant.name}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Berat Diterima</p>
                  <p className="font-medium">{formatWeight(dispute.farmer_sale.received_weight)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Nilai</p>
                  <p className="font-medium">{formatRupiah(dispute.farmer_sale.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QC Result Summary */}
          {dispute.qc_result && (
            <Card>
              <CardHeader>
                <CardTitle>Hasil Quality Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Grade Final</p>
                  <Badge className="bg-cyan-100 text-cyan-800">
                    {dispute.qc_result.final_grade_code}
                  </Badge>
                </div>
                {dispute.qc_result.grade_breakdowns && dispute.qc_result.grade_breakdowns.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Rincian Grade</p>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Berat</TableHead>
                              <TableHead className="text-right">Harga/kg</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dispute.qc_result.grade_breakdowns.map((gb) => (
                              <TableRow key={gb.id}>
                                <TableCell className="font-medium">{gb.grade_code}</TableCell>
                                <TableCell className="text-right">{formatWeight(gb.weight)}</TableCell>
                                <TableCell className="text-right">{gb.price_per_kg ? formatRupiah(gb.price_per_kg) : '-'}</TableCell>
                                <TableCell className="text-right">{gb.subtotal ? formatRupiah(gb.subtotal) : '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manager Decision (if resolved) */}
          {dispute.manager_decision && (
            <Card>
              <CardHeader>
                <CardTitle>Keputusan Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Keputusan</p>
                    <Badge className={STATUS_COLORS[dispute.manager_decision] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[dispute.manager_decision] || dispute.manager_decision}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Ditinjau Oleh</p>
                    <p className="font-medium">{dispute.reviewed_by?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tanggal Resolusi</p>
                    <p className="font-medium">{formatDateTime(dispute.resolved_at)}</p>
                  </div>
                  {dispute.resolution_note && (
                    <div className="md:col-span-2">
                      <p className="text-gray-500">Catatan Resolusi</p>
                      <p className="font-medium whitespace-pre-wrap">{dispute.resolution_note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolve Form (inline, when DALAM_REVIEW) */}
          {dispute.status === 'DALAM_REVIEW' && (
            <Card>
              <CardHeader>
                <CardTitle>Selesaikan Keberatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 max-w-lg">
                  <div className="grid gap-2">
                    <Label htmlFor="decision">Keputusan</Label>
                    <Select
                      value={decision}
                      onValueChange={(v) => setDecision(v ?? '')}
                    >
                      <SelectTrigger id="decision">
                        <SelectValue placeholder="Pilih keputusan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DECISION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resolution_note">Catatan Resolusi</Label>
                    <Textarea
                      id="resolution_note"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Jelaskan keputusan yang diambil..."
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adjustment_amount">Jumlah Penyesuaian (opsional)</Label>
                    <Input
                      id="adjustment_amount"
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Isi jika ada penyesuaian nilai yang perlu diberikan.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleResolve} disabled={actionLoading}>
                      {actionLoading ? 'Memproses...' : 'Selesaikan'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
