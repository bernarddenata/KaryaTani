'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/utils/api-client'
import { formatRupiah } from '@/lib/utils/format'
import Link from 'next/link'

interface Wallet {
  id: string
  available_balance: string
  held_balance: string
  total_paid: string
  farmer?: { id: string; name: string; farmer_number: string }
  cooperative?: { id: string; name: string }
}

export default function SaldoPetaniPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchWallets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ data: Wallet[]; total: number }>(
        `/api/farmer-wallets?page=${page}&limit=20`
      )
      if (res.success && res.data) {
        setWallets(res.data.data || [])
        setTotal(res.data.total || 0)
      }
    } catch {
      // handled by empty state
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const columns: Column<Wallet>[] = [
    {
      key: 'farmer_name',
      label: 'Pemilik Hasil Tani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'cooperative',
      label: 'Koperasi',
      render: (item) => item.cooperative?.name || '-',
    },
    {
      key: 'available_balance',
      label: 'Saldo Tersedia',
      render: (item) => (
        <span className="font-medium text-green-700">{formatRupiah(item.available_balance)}</span>
      ),
    },
    {
      key: 'held_balance',
      label: 'Saldo Ditahan',
      render: (item) => (
        <span className="text-orange-600">{formatRupiah(item.held_balance)}</span>
      ),
    },
    {
      key: 'total_paid',
      label: 'Total Sudah Dibayar',
      render: (item) => formatRupiah(item.total_paid),
    },
  ]

  return (
    <DashboardShell
      title="Saldo Petani"
      description="Lihat saldo dompet petani dari hasil penjualan ke koperasi."
      permission="farmer_wallets.view"
    >
      <DataTable
        columns={columns}
        data={wallets}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        actions={(item) => (
          <Link href={`/saldo-petani/${item.id}`}>
            <Button variant="ghost" size="sm">
              Lihat Detail
            </Button>
          </Link>
        )}
        emptyMessage="Belum ada data saldo petani."
      />
    </DashboardShell>
  )
}
