'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch, apiUpload } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate, formatDateTime, formatWeight,
  STATUS_LABELS, STATUS_COLORS, RELATIONSHIP_TYPE_LABELS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, User, Weight, Image as ImageIcon, Upload } from 'lucide-react'

/* ---------- types ---------- */

interface SalePhoto {
  id: string
  photo_type: string
  file: { file_url: string; file_name: string }
}

interface GradeBreakdown {
  grade_name: string
  grade_code: string
  weight: number | string
  price_per_unit: number | string
  estimated_amount: number | string
}

interface QcItem {
  id: string
  item_name: string
  value_text?: string
  value_number?: number | string
  value_json?: any
  notes?: string
}

interface QcResult {
  id: string
  status: string
  final_grade_code?: string
  total_weight_checked?: string
  final_accepted_weight?: string
  total_rejected_weight?: string
  notes?: string
  submitted_at?: string
  qc_officer?: { name: string }
  items?: QcItem[]
  grade_breakdowns?: GradeBreakdown[]
}

interface Dispute {
  id: string
  dispute_number: string
  status: string
  reason_category: string
}

interface SaleDetail {
  id: string
  sale_number: string
  batch_number: string
  status: string
  initial_weight?: string
  received_weight?: string
  total_amount?: string
  notes?: string
  received_at?: string
  calculated_at?: string
  created_at: string
  farmer: { id: string; name: string; farmer_number: string; phone?: string }
  representative?: { id: string; name: string; phone?: string; relationship_type?: string } | null
  commodity: { id: string; name: string; code: string }
  commodity_variant?: { id: string; name: string } | null
  cooperative: { id: string; name: string }
  price_list?: { id: string; name: string; items?: any[] } | null
  qc_template?: { id: string; name: string } | null
  received_by?: { id: string; name: string } | null
  photos: SalePhoto[]
  qc_results: QcResult[]
  disputes: Dispute[]
}

interface TimelineEntry {
  id: string
  action: string
  created_at: string
  actor?: { id: string; name: string }
  description?: string
}

/* ---------- component ---------- */

export default function PenjualanDetailPage() {
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [saleRes, timelineRes] = await Promise.all([
        apiFetch<SaleDetail>(`/api/farmer-sales/${id}`),
        apiFetch<TimelineEntry[]>(`/api/farmer-sales/${id}/timeline`),
      ])
      if (saleRes.success && saleRes.data) setSale(saleRes.data)
      if (timelineRes.success && timelineRes.data) {
        setTimeline(Array.isArray(timelineRes.data) ? timelineRes.data : [])
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

  /* -- actions -- */

  const handleCalculatePrice = async () => {
    setActionLoading(true)
    const res = await apiFetch(`/api/farmer-sales/${id}/calculate-price`, { method: 'POST' })
    if (res.success) {
      toast.success('Harga berhasil dihitung')
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal menghitung harga')
    }
    setActionLoading(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadLoading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i])
    }
    const res = await apiUpload(`/api/farmer-sales/${id}/photos`, formData)
    if (res.success) {
      toast.success('Foto berhasil diunggah')
      fetchData()
    } else {
      toast.error(res.error?.message || 'Gagal mengunggah foto')
    }
    setUploadLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* -- derived -- */

  const qcResult = sale?.qc_results?.[0] ?? null
  const gradeBreakdowns = qcResult?.grade_breakdowns ?? []

  const totalFromBreakdowns = gradeBreakdowns.reduce((sum, gb) => {
    const amt = typeof gb.estimated_amount === 'string' ? parseFloat(gb.estimated_amount) : gb.estimated_amount
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)

  /* -- render -- */

  return (
    <DashboardShell
      title="Detail Penjualan"
      description="Informasi lengkap penjualan"
      permission="farmer_sales.view"
    >
      {/* Back button */}
      <div className="mb-4">
        <Link href="/penjualan">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        </div>
      ) : !sale ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data penjualan tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ---- Sale Info Card ---- */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nomor Penjualan</p>
                  <p className="font-medium">{sale.sale_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium">{sale.batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={`${STATUS_COLORS[sale.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[sale.status] || sale.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Koperasi</p>
                  <p className="font-medium">{sale.cooperative?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Diterima</p>
                  <p className="font-medium">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                    {sale.received_at ? formatDateTime(sale.received_at) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diterima Oleh</p>
                  <p className="font-medium">{sale.received_by?.name || '-'}</p>
                </div>
                {sale.notes && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="font-medium whitespace-pre-wrap">{sale.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---- Owner + Representative cards ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pemilik */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <User className="inline h-4 w-4 mr-1" /> Pemilik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="font-medium">{sale.farmer?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nomor Petani</p>
                    <p className="font-medium">{sale.farmer?.farmer_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium">{sale.farmer?.phone || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pengantar */}
            {sale.representative && (
              <Card>
                <CardHeader>
                  <CardTitle>Pengantar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Nama</p>
                      <p className="font-medium">{sale.representative.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telepon</p>
                      <p className="font-medium">{sale.representative.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hubungan</p>
                      <p className="font-medium">
                        {sale.representative.relationship_type
                          ? (RELATIONSHIP_TYPE_LABELS[sale.representative.relationship_type] || sale.representative.relationship_type)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ---- Komoditas ---- */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Weight className="inline h-4 w-4 mr-1" /> Komoditas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Komoditas</p>
                  <p className="font-medium">
                    {sale.commodity?.name || '-'}
                    {sale.commodity_variant ? ` - ${sale.commodity_variant.name}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Berat Awal</p>
                  <p className="font-medium">{formatWeight(sale.initial_weight)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Berat Diterima</p>
                  <p className="font-medium">{formatWeight(sale.received_weight)}</p>
                </div>
                {sale.total_amount && (
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-semibold text-green-700">{formatRupiah(sale.total_amount)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---- Photos ---- */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  <ImageIcon className="inline h-4 w-4 mr-1" /> Foto Dokumentasi
                </CardTitle>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadLoading ? 'Mengunggah...' : 'Unggah Foto'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sale.photos && sale.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sale.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.file?.file_url}
                        alt={photo.file?.file_name || 'Foto penjualan'}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {photo.photo_type || photo.file?.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">Belum ada foto dokumentasi.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- QC Result ---- */}
          {qcResult && (
            <Card>
              <CardHeader>
                <CardTitle>Hasil Quality Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Petugas QC</p>
                    <p className="font-medium">{qcResult.qc_officer?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Submit</p>
                    <p className="font-medium">{qcResult.submitted_at ? formatDateTime(qcResult.submitted_at) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grade Final</p>
                    {qcResult.final_grade_code ? (
                      <Badge className="bg-green-100 text-green-800">{qcResult.final_grade_code}</Badge>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status QC</p>
                    <Badge className={STATUS_COLORS[qcResult.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[qcResult.status] || qcResult.status}
                    </Badge>
                  </div>
                </div>

                {/* Berat summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Berat Diperiksa</p>
                    <p className="font-medium">{formatWeight(qcResult.total_weight_checked)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Berat Diterima</p>
                    <p className="font-medium">{formatWeight(qcResult.final_accepted_weight)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Berat Ditolak</p>
                    <p className="font-medium">{formatWeight(qcResult.total_rejected_weight)}</p>
                  </div>
                </div>

                {/* QC Items */}
                {qcResult.items && qcResult.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Item Pemeriksaan</p>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nama Item</TableHead>
                              <TableHead>Nilai</TableHead>
                              <TableHead>Catatan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {qcResult.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell>{item.value_text || item.value_number || '-'}</TableCell>
                                <TableCell>{item.notes || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}

                {/* Grade Breakdowns */}
                {gradeBreakdowns.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Rincian Grade</p>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Berat (kg)</TableHead>
                              <TableHead className="text-right">Harga/kg</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gradeBreakdowns.map((gb, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{gb.grade_name}</TableCell>
                                <TableCell className="text-right">{formatWeight(gb.weight)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(gb.price_per_unit)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(gb.estimated_amount)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-gray-50 font-bold">
                              <TableCell colSpan={3} className="text-right">Total</TableCell>
                              <TableCell className="text-right text-lg">
                                {formatRupiah(sale.total_amount ?? totalFromBreakdowns)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}

                {qcResult.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500">Catatan QC</p>
                      <p className="whitespace-pre-wrap">{qcResult.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---- Disputes ---- */}
          {sale.disputes && sale.disputes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Keberatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Keberatan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.disputes.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.dispute_number}</TableCell>
                          <TableCell>{d.reason_category}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}>
                              {STATUS_LABELS[d.status] || d.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ---- Action Buttons ---- */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3 items-center">
                {sale.status === 'MENUNGGU_QC' && (
                  <Link href={`/hasil-qc/${sale.id}`}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Mulai QC
                    </Button>
                  </Link>
                )}
                {sale.status === 'QC_DIPROSES' && (
                  <Link href={`/hasil-qc/${sale.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Lanjutkan QC
                    </Button>
                  </Link>
                )}
                {sale.status === 'QC_SELESAI' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCalculatePrice}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Menghitung...' : 'Hitung Harga'}
                  </Button>
                )}
                {sale.status === 'MENUNGGU_PEMBAYARAN' && (
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total yang harus dibayar</p>
                      <p className="text-xl font-bold text-green-700">{formatRupiah(sale.total_amount)}</p>
                    </div>
                    <Link href="/bayar-petani">
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Bayar Petani
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---- Timeline ---- */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-4 items-start">
                      <div className="min-w-[140px] text-sm text-gray-500">
                        {formatDateTime(entry.created_at)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.action}</p>
                        {entry.description && (
                          <p className="text-sm text-gray-500">{entry.description}</p>
                        )}
                        {entry.actor?.name && (
                          <p className="text-xs text-gray-400 mt-0.5">oleh {entry.actor.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Belum ada riwayat aktivitas.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
