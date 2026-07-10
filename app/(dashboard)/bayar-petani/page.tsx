'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDateTime,
  STATUS_LABELS, STATUS_COLORS, PAYOUT_METHOD_LABELS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface Payout {
  id: string
  payout_number: string
  amount: string
  payout_method: string
  transfer_reference?: string
  status: string
  paid_at?: string
  created_at: string
  farmer?: { id: string; name: string }
}

interface Farmer {
  id: string
  farmer_number: string
  name: string
}

interface Wallet {
  id: string
  farmer_id: string
  available_balance: string
}

const INITIAL_FORM = {
  farmer_id: '',
  cooperative_id: '',
  amount: '',
  payout_method: '',
  transfer_reference: '',
}

export default function BayarPetaniPage() {
  const [data, setData] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await apiFetch(`/api/farmer-payouts?${params.toString()}`)
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
    fetchPayouts()
  }, [fetchPayouts])

  useEffect(() => {
    apiFetch<Farmer[]>('/api/farmers').then((res) => {
      if (res.success && res.data) {
        setFarmers(Array.isArray(res.data) ? res.data : [])
      }
    })
  }, [])

  useEffect(() => {
    async function loadWallet() {
      if (!formData.farmer_id) {
        setWallet(null)
        return
      }
      setWalletLoading(true)
      try {
        const res = await apiFetch<Wallet>(`/api/farmers/${formData.farmer_id}/wallet`)
        if (res.success && res.data) {
          setWallet(res.data)
        } else {
          setWallet(null)
        }
      } catch {
        setWallet(null)
      } finally {
        setWalletLoading(false)
      }
    }
    loadWallet()
  }, [formData.farmer_id])

  const openCreate = () => {
    setFormData(INITIAL_FORM)
    setWallet(null)
    setDialogOpen(true)
  }

  const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0
  const enteredAmount = parseFloat(formData.amount) || 0
  const amountValid = enteredAmount > 0 && enteredAmount <= availableBalance

  const handleSubmit = async () => {
    if (!amountValid) {
      toast.error('Jumlah pembayaran tidak valid')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        farmer_id: formData.farmer_id,
        cooperative_id: formData.cooperative_id,
        amount: enteredAmount,
        payout_method: formData.payout_method,
      }
      if (formData.transfer_reference) {
        body.transfer_reference = formData.transfer_reference
      }

      const res = await apiFetch('/api/farmer-payouts', { method: 'POST', body })
      if (res.success) {
        toast.success('Pembayaran berhasil dibuat')
        setDialogOpen(false)
        setFormData(INITIAL_FORM)
        fetchPayouts()
      } else {
        toast.error(res.error?.message || 'Gagal membuat pembayaran')
      }
    } catch {
      toast.error('Terjadi kesalahan saat membuat pembayaran')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Payout>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDateTime(item.paid_at || item.created_at),
    },
    {
      key: 'payout_number',
      label: 'Nomor Pembayaran',
    },
    {
      key: 'farmer',
      label: 'Petani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'amount',
      label: 'Jumlah',
      render: (item) => (
        <span className="font-medium">{formatRupiah(item.amount)}</span>
      ),
    },
    {
      key: 'payout_method',
      label: 'Metode',
      render: (item) => PAYOUT_METHOD_LABELS[item.payout_method] || item.payout_method,
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
  ]

  return (
    <DashboardShell
      title="Bayar Petani"
      description="Proses pembayaran ke petani berdasarkan saldo yang tersedia."
      permission="farmer_payouts.view"
    >
      <div className="flex items-center justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Buat Pembayaran
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        loading={loading}
        onPageChange={setPage}
        emptyMessage="Belum ada data pembayaran."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Pembayaran</DialogTitle>
            <DialogDescription>
              Buat pembayaran baru ke petani. Pastikan saldo tersedia mencukupi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="farmer_id">Petani</Label>
              <Select
                value={formData.farmer_id || 'NONE'}
                onValueChange={(v) => setFormData({
                  ...formData,
                  farmer_id: v === 'NONE' ? '' : (v ?? ''),
                  amount: '',
                })}
              >
                <SelectTrigger id="farmer_id">
                  <SelectValue placeholder="Pilih petani">
                    {(v: string | null) => {
                      if (!v || v === 'NONE') return 'Pilih petani';
                      const item = farmers.find(f => f.id === v);
                      return item ? `${item.farmer_number} - ${item.name}` : v;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" disabled>Pilih petani</SelectItem>
                  {farmers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.farmer_number} - {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.farmer_id && (
              <Card className="border-cyan-100">
                <CardContent className="pt-4 pb-3">
                  <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
                  {walletLoading ? (
                    <p className="text-lg font-semibold text-muted-foreground">Memuat...</p>
                  ) : wallet ? (
                    <p className="text-lg font-semibold text-[#065366]">
                      {formatRupiah(wallet.available_balance)}
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-muted-foreground">Rp0</p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Jumlah Pembayaran</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Masukkan jumlah pembayaran"
              />
              {formData.amount && !amountValid && (
                <p className="text-sm text-red-600">
                  {enteredAmount <= 0
                    ? 'Jumlah harus lebih dari 0'
                    : `Jumlah melebihi saldo tersedia (${formatRupiah(availableBalance)})`}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payout_method">Metode Pembayaran</Label>
              <Select
                value={formData.payout_method || 'NONE'}
                onValueChange={(v) => setFormData({ ...formData, payout_method: v === 'NONE' ? '' : (v ?? '') })}
              >
                <SelectTrigger id="payout_method">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" disabled>Pilih metode</SelectItem>
                  {Object.entries(PAYOUT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transfer_reference">Referensi Transfer (opsional)</Label>
              <Input
                id="transfer_reference"
                value={formData.transfer_reference}
                onChange={(e) => setFormData({ ...formData, transfer_reference: e.target.value })}
                placeholder="No. referensi atau bukti transfer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.farmer_id || !formData.payout_method || !amountValid}
            >
              {saving ? 'Menyimpan...' : 'Buat Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
