'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate, formatDateTime, formatWeight,
  STATUS_LABELS, STATUS_COLORS, DISPUTE_REASON_LABELS,
  MUTATION_TYPE_LABELS, PAYOUT_METHOD_LABELS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { Search, AlertTriangle, Package } from 'lucide-react'

interface BatchData {
  sale?: {
    id: string
    sale_number: string
    batch_number: string
    status: string
    created_at: string
  }
  farmer?: {
    id: string
    name: string
    farmer_number: string
    phone?: string
  }
  deliverer?: {
    id: string
    name: string
    phone?: string
    relationship_type?: string
  }
  commodity?: {
    name: string
    variant?: string
    gross_weight?: string
    tare_weight?: string
    net_weight?: string
  }
  qc_result?: {
    id: string
    overall_grade?: string
    notes?: string
    items?: Array<{
      grade: string
      weight: string
      percentage?: string
    }>
  }
  price_calculation?: {
    total_price?: string
    items?: Array<{
      grade: string
      weight: string
      price_per_kg?: string
      subtotal?: string
    }>
  }
  wallet_mutation?: {
    id: string
    mutation_type: string
    amount_in: string
    amount_out: string
    balance_after: string
    created_at: string
  }
  payout?: {
    id: string
    payout_number: string
    amount: string
    payout_method: string
    status: string
    paid_at?: string
  }
  dispute?: {
    id: string
    dispute_number: string
    reason_category: string
    status: string
    notes?: string
    created_at: string
  }
  stockBalances?: Array<{
    id: string
    grade_code?: string | null
    grade_name?: string | null
    unit: string
    quantity: string
    warehouse?: { id: string; code: string; name: string }
    location?: { id: string; code: string; name: string; location_type: string }
  }>
  stockMovements?: Array<{
    id: string
    movement_type: string
    quantity_in: string
    quantity_out: string
    balance_after: string
    unit?: string
    created_at: string
    warehouse?: { id: string; code: string; name: string }
    location?: { id: string; code: string; name: string; location_type: string }
  }>
}

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

function formatQty(value?: string | number | null, unit?: string): string {
  const n = Number(value ?? 0)
  const formatted = n.toLocaleString('id-ID')
  return unit ? `${formatted} ${unit}` : formatted
}

export default function BatchPage() {
  const [batchNumber, setBatchNumber] = useState('')
  const [batchData, setBatchData] = useState<BatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    const query = batchNumber.trim()
    if (!query) {
      toast.error('Masukkan nomor batch')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await apiFetch<BatchData>(`/api/batch/${encodeURIComponent(query)}`)
      if (res.success && res.data) {
        setBatchData(res.data)
      } else {
        setBatchData(null)
      }
    } catch {
      setBatchData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <DashboardShell
      title="Lacak Batch"
      description="Cari dan lacak riwayat lengkap dari sebuah batch penjualan."
      permission="batch.view"
    >
      {/* Search Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Masukkan nomor batch..."
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 h-11 text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="h-11">
          {loading ? 'Mencari...' : 'Cari Batch'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Not Found State */}
      {searched && !loading && !batchData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-orange mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Batch tidak ditemukan</h3>
            <p className="text-gray-500">
              Nomor batch &ldquo;{batchNumber}&rdquo; tidak ditemukan dalam sistem. Periksa kembali nomor batch Anda.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Traceability Results */}
      {!loading && batchData && (
        <div className="grid gap-4">
          {/* Sale Info */}
          {batchData.sale && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informasi Penjualan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Penjualan</p>
                    <p className="font-medium">{batchData.sale.sale_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Batch</p>
                    <p className="font-medium">{batchData.sale.batch_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={STATUS_COLORS[batchData.sale.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[batchData.sale.status] || batchData.sale.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="font-medium">{formatDateTime(batchData.sale.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Farmer Info */}
          {batchData.farmer && (
            <Card>
              <CardHeader>
                <CardTitle>Pemilik Hasil Tani</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama</p>
                    <p className="font-medium">{batchData.farmer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Petani</p>
                    <p className="font-medium">{batchData.farmer.farmer_number}</p>
                  </div>
                  {batchData.farmer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="font-medium">{batchData.farmer.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deliverer Info */}
          {batchData.deliverer && (
            <Card>
              <CardHeader>
                <CardTitle>Pengantar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama</p>
                    <p className="font-medium">{batchData.deliverer.name}</p>
                  </div>
                  {batchData.deliverer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="font-medium">{batchData.deliverer.phone}</p>
                    </div>
                  )}
                  {batchData.deliverer.relationship_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Hubungan</p>
                      <p className="font-medium">{batchData.deliverer.relationship_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commodity Info */}
          {batchData.commodity && (
            <Card>
              <CardHeader>
                <CardTitle>Komoditas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Komoditas</p>
                    <p className="font-medium">{batchData.commodity.name}</p>
                  </div>
                  {batchData.commodity.variant && (
                    <div>
                      <p className="text-sm text-muted-foreground">Variasi</p>
                      <p className="font-medium">{batchData.commodity.variant}</p>
                    </div>
                  )}
                  {batchData.commodity.gross_weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Berat Kotor</p>
                      <p className="font-medium">{formatWeight(batchData.commodity.gross_weight)}</p>
                    </div>
                  )}
                  {batchData.commodity.tare_weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Berat Tara</p>
                      <p className="font-medium">{formatWeight(batchData.commodity.tare_weight)}</p>
                    </div>
                  )}
                  {batchData.commodity.net_weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Berat Bersih</p>
                      <p className="font-medium">{formatWeight(batchData.commodity.net_weight)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QC Result */}
          {batchData.qc_result && (
            <Card>
              <CardHeader>
                <CardTitle>Hasil QC</CardTitle>
              </CardHeader>
              <CardContent>
                {batchData.qc_result.overall_grade && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Grade Keseluruhan</p>
                    <Badge variant="secondary" className="text-base mt-1">
                      {batchData.qc_result.overall_grade}
                    </Badge>
                  </div>
                )}
                {batchData.qc_result.items && batchData.qc_result.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium">Grade</th>
                          <th className="text-left py-2 pr-4 font-medium">Berat</th>
                          <th className="text-left py-2 font-medium">Persentase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchData.qc_result.items.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 pr-4">{item.grade}</td>
                            <td className="py-2 pr-4">{formatWeight(item.weight)}</td>
                            <td className="py-2">{item.percentage ? `${item.percentage}%` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {batchData.qc_result.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Catatan</p>
                    <p className="text-sm">{batchData.qc_result.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Price Calculation */}
          {batchData.price_calculation && (
            <Card>
              <CardHeader>
                <CardTitle>Perhitungan Harga</CardTitle>
              </CardHeader>
              <CardContent>
                {batchData.price_calculation.items && batchData.price_calculation.items.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium">Grade</th>
                          <th className="text-left py-2 pr-4 font-medium">Berat</th>
                          <th className="text-left py-2 pr-4 font-medium">Harga/Kg</th>
                          <th className="text-left py-2 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchData.price_calculation.items.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 pr-4">{item.grade}</td>
                            <td className="py-2 pr-4">{formatWeight(item.weight)}</td>
                            <td className="py-2 pr-4">{formatRupiah(item.price_per_kg)}</td>
                            <td className="py-2">{formatRupiah(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {batchData.price_calculation.total_price && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="font-medium">Total Harga</p>
                    <p className="text-lg font-bold text-primary">
                      {formatRupiah(batchData.price_calculation.total_price)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wallet Mutation */}
          {batchData.wallet_mutation && (
            <Card>
              <CardHeader>
                <CardTitle>Mutasi Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipe Mutasi</p>
                    <p className="font-medium">
                      {MUTATION_TYPE_LABELS[batchData.wallet_mutation.mutation_type] || batchData.wallet_mutation.mutation_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Masuk</p>
                    <p className="font-medium text-primary">{formatRupiah(batchData.wallet_mutation.amount_in)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Keluar</p>
                    <p className="font-medium text-destructive">{formatRupiah(batchData.wallet_mutation.amount_out)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Setelah</p>
                    <p className="font-medium">{formatRupiah(batchData.wallet_mutation.balance_after)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout Info */}
          {batchData.payout && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Pembayaran</p>
                    <p className="font-medium">{batchData.payout.payout_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah</p>
                    <p className="font-medium text-primary">{formatRupiah(batchData.payout.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Metode</p>
                    <p className="font-medium">
                      {PAYOUT_METHOD_LABELS[batchData.payout.payout_method] || batchData.payout.payout_method}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={STATUS_COLORS[batchData.payout.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[batchData.payout.status] || batchData.payout.status}
                    </Badge>
                  </div>
                  {batchData.payout.paid_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Bayar</p>
                      <p className="font-medium">{formatDateTime(batchData.payout.paid_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dispute Info */}
          {batchData.dispute && (
            <Card className="border-orange/30">
              <CardHeader>
                <CardTitle className="text-orange">Keberatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Keberatan</p>
                    <p className="font-medium">{batchData.dispute.dispute_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alasan</p>
                    <p className="font-medium">
                      {DISPUTE_REASON_LABELS[batchData.dispute.reason_category] || batchData.dispute.reason_category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={STATUS_COLORS[batchData.dispute.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[batchData.dispute.status] || batchData.dispute.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="font-medium">{formatDate(batchData.dispute.created_at)}</p>
                  </div>
                </div>
                {batchData.dispute.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Catatan</p>
                    <p className="text-sm">{batchData.dispute.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stock Balances (This Batch) */}
          {batchData.stockBalances && batchData.stockBalances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Stok Saat Ini (Batch Ini)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">Gudang</th>
                        <th className="text-left py-2 pr-4 font-medium">Lokasi</th>
                        <th className="text-left py-2 pr-4 font-medium">Grade</th>
                        <th className="text-left py-2 font-medium">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchData.stockBalances.map((balance) => (
                        <tr key={balance.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{balance.warehouse?.name ?? '-'}</td>
                          <td className="py-2 pr-4">{balance.location?.name ?? '-'}</td>
                          <td className="py-2 pr-4">{balance.grade_name || balance.grade_code || '-'}</td>
                          <td className="py-2">{formatQty(balance.quantity, balance.unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock Movements */}
          {batchData.stockMovements && batchData.stockMovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mutasi Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">Tanggal</th>
                        <th className="text-left py-2 pr-4 font-medium">Tipe</th>
                        <th className="text-left py-2 pr-4 font-medium">Lokasi</th>
                        <th className="text-left py-2 pr-4 font-medium">Masuk</th>
                        <th className="text-left py-2 pr-4 font-medium">Keluar</th>
                        <th className="text-left py-2 font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchData.stockMovements.map((movement) => (
                        <tr key={movement.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(movement.created_at)}</td>
                          <td className="py-2 pr-4">
                            {MOVEMENT_TYPE_LABELS[movement.movement_type] || movement.movement_type}
                          </td>
                          <td className="py-2 pr-4">{movement.location?.name ?? '-'}</td>
                          <td className="py-2 pr-4 text-primary">
                            {Number(movement.quantity_in) > 0 ? formatQty(movement.quantity_in, movement.unit) : '-'}
                          </td>
                          <td className="py-2 pr-4 text-destructive">
                            {Number(movement.quantity_out) > 0 ? formatQty(movement.quantity_out, movement.unit) : '-'}
                          </td>
                          <td className="py-2">{formatQty(movement.balance_after, movement.unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
