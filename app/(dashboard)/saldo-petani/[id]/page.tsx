'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate, formatDateTime,
  MUTATION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PAYOUT_METHOD_LABELS,
} from '@/lib/utils/format'
import { ArrowLeft } from 'lucide-react'

interface Mutation {
  id: string
  mutation_type: string
  amount_in: string
  amount_out: string
  balance_before: string
  balance_after: string
  notes?: string
  created_at: string
}

interface Payout {
  id: string
  payout_number: string
  amount: string
  payout_method: string
  status: string
  paid_at: string
}

interface WalletDetail {
  id: string
  available_balance: string
  held_balance: string
  total_paid: string
  farmer?: {
    id: string
    name: string
    farmer_number: string
    phone: string
  }
  cooperative?: { id: string; name: string }
  mutations?: Mutation[]
  payouts?: Payout[]
}

export default function SaldoPetaniDetailPage() {
  const { id } = useParams()
  const [wallet, setWallet] = useState<WalletDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWallet = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<WalletDetail>(`/api/farmer-wallets/${id}`)
      if (res.success && res.data) {
        setWallet(res.data)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchWallet()
  }, [id, fetchWallet])

  return (
    <DashboardShell title="Detail Saldo Petani" description="Informasi saldo dan riwayat transaksi petani." permission="farmer_wallets.view">
      <div className="flex items-center justify-between mb-4">
        <Link href="/saldo-petani">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </Link>
        <Link href="/bayar-petani">
          <Button size="sm">Bayar Petani</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        </div>
      ) : !wallet ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data saldo tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Farmer Info */}
          <Card>
            <CardHeader>
              <CardTitle>{wallet.farmer?.name || '-'}</CardTitle>
              <p className="text-sm text-gray-500">
                {wallet.farmer?.farmer_number || '-'}
                {wallet.farmer?.phone && ` • ${wallet.farmer.phone}`}
                {wallet.cooperative?.name && ` • ${wallet.cooperative.name}`}
              </p>
            </CardHeader>
          </Card>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Saldo Tersedia</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatRupiah(wallet.available_balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Saldo Ditahan</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatRupiah(wallet.held_balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Total Dibayar</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatRupiah(wallet.total_paid)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mutations */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Mutasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Masuk</TableHead>
                        <TableHead>Keluar</TableHead>
                        <TableHead>Saldo Sebelum</TableHead>
                        <TableHead>Saldo Sesudah</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!wallet.mutations || wallet.mutations.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Belum ada riwayat mutasi.
                          </TableCell>
                        </TableRow>
                      ) : (
                        wallet.mutations.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{formatDateTime(m.created_at)}</TableCell>
                            <TableCell>
                              {MUTATION_TYPE_LABELS[m.mutation_type] || m.mutation_type}
                            </TableCell>
                            <TableCell className="text-green-700">
                              {formatRupiah(m.amount_in)}
                            </TableCell>
                            <TableCell className="text-red-700">
                              {formatRupiah(m.amount_out)}
                            </TableCell>
                            <TableCell>{formatRupiah(m.balance_before)}</TableCell>
                            <TableCell>{formatRupiah(m.balance_after)}</TableCell>
                            <TableCell>{m.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payouts */}
            <Card>
              <CardHeader>
                <CardTitle>Pembayaran Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nomor</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!wallet.payouts || wallet.payouts.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Belum ada data pembayaran.
                          </TableCell>
                        </TableRow>
                      ) : (
                        wallet.payouts.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{formatDate(p.paid_at)}</TableCell>
                            <TableCell>{p.payout_number}</TableCell>
                            <TableCell>{formatRupiah(p.amount)}</TableCell>
                            <TableCell>
                              {PAYOUT_METHOD_LABELS[p.payout_method] || p.payout_method}
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-800'}>
                                {STATUS_LABELS[p.status] || p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
