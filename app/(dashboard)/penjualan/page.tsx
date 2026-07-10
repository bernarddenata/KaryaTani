'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatRupiah, formatDate, formatWeight,
  STATUS_LABELS, STATUS_COLORS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'

interface Sale {
  id: string
  sale_number: string
  batch_number: string
  initial_weight?: string
  received_weight?: string
  total_amount?: string
  status: string
  notes?: string
  created_at: string
  farmer?: { id: string; name: string; farmer_number: string }
  representative?: { id: string; name: string }
  commodity?: { id: string; code: string; name: string }
  commodity_variant?: { id: string; code: string; name: string }
}

interface Cooperative {
  id: string
  code: string
  name: string
}

interface Farmer {
  id: string
  farmer_number: string
  name: string
  cooperative_id: string
  representatives?: Representative[]
}

interface Representative {
  id: string
  name: string
  relationship_type: string
}

interface Commodity {
  id: string
  code: string
  name: string
  variants?: CommodityVariant[]
}

interface CommodityVariant {
  id: string
  code: string
  name: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'MENUNGGU_QC', label: 'Menunggu QC' },
  { value: 'QC_DIPROSES', label: 'QC Diproses' },
  { value: 'QC_SELESAI', label: 'QC Selesai' },
  { value: 'MENUNGGU_PEMBAYARAN', label: 'Menunggu Pembayaran' },
  { value: 'DIBAYAR', label: 'Dibayar' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
]

const INITIAL_FORM = {
  cooperative_id: '',
  farmer_id: '',
  representative_id: '',
  commodity_id: '',
  commodity_variant_id: '',
  initial_weight: '',
  received_weight: '',
  notes: '',
}

export default function PenjualanPage() {
  const [data, setData] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [variants, setVariants] = useState<CommodityVariant[]>([])

  const fetchSales = useCallback(async (p: number, s: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (s) params.set('status', s)
    const res = await apiFetch(`/api/farmer-sales?${params.toString()}`)
    if (res.success) {
      setData(Array.isArray(res.data) ? res.data : res.data?.items || [])
      setTotal(res.meta?.total ?? res.data?.length ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSales(page, status)
  }, [page, status, fetchSales])

  // Fetch cooperatives and commodities on mount for the dialog
  useEffect(() => {
    async function loadOptions() {
      const [coopsRes, commsRes] = await Promise.all([
        apiFetch<Cooperative[]>('/api/cooperatives'),
        apiFetch<Commodity[]>('/api/commodities'),
      ])
      if (coopsRes.success && coopsRes.data) {
        setCooperatives(Array.isArray(coopsRes.data) ? coopsRes.data : [])
      }
      if (commsRes.success && commsRes.data) {
        setCommodities(Array.isArray(commsRes.data) ? commsRes.data : [])
      }
    }
    loadOptions()
  }, [])

  // Fetch farmers when cooperative changes
  useEffect(() => {
    async function loadFarmers() {
      if (!formData.cooperative_id) {
        setFarmers([])
        return
      }
      const res = await apiFetch<Farmer[]>(`/api/farmers?cooperative_id=${formData.cooperative_id}`)
      if (res.success && res.data) {
        setFarmers(Array.isArray(res.data) ? res.data : [])
      }
    }
    loadFarmers()
  }, [formData.cooperative_id])

  // Fetch representatives when farmer changes
  useEffect(() => {
    async function loadRepresentatives() {
      if (!formData.farmer_id) {
        setRepresentatives([])
        return
      }
      const res = await apiFetch<Farmer>(`/api/farmers/${formData.farmer_id}`)
      if (res.success && res.data?.representatives) {
        setRepresentatives(res.data.representatives)
      } else {
        setRepresentatives([])
      }
    }
    loadRepresentatives()
  }, [formData.farmer_id])

  // Load variants when commodity changes
  useEffect(() => {
    if (!formData.commodity_id) {
      setVariants([])
      return
    }
    const commodity = commodities.find((c) => c.id === formData.commodity_id)
    if (commodity?.variants && commodity.variants.length > 0) {
      setVariants(commodity.variants)
    } else {
      async function loadVariants() {
        const res = await apiFetch<Commodity>(`/api/commodities/${formData.commodity_id}`)
        if (res.success && res.data?.variants) {
          setVariants(res.data.variants)
        } else {
          setVariants([])
        }
      }
      loadVariants()
    }
  }, [formData.commodity_id, commodities])

  const openCreate = () => {
    setFormData(INITIAL_FORM)
    setFormStep(1)
    setRepresentatives([])
    setVariants([])
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const body: Record<string, any> = {
      farmer_id: formData.farmer_id,
      commodity_id: formData.commodity_id,
      initial_weight: parseFloat(formData.initial_weight) || 0,
      received_weight: parseFloat(formData.received_weight) || 0,
      notes: formData.notes || undefined,
    }
    if (formData.representative_id) body.representative_id = formData.representative_id
    if (formData.commodity_variant_id) body.commodity_variant_id = formData.commodity_variant_id

    const res = await apiFetch('/api/farmer-sales', { method: 'POST', body })
    if (res.success) {
      toast.success('Penjualan berhasil dibuat')
      setDialogOpen(false)
      setFormData(INITIAL_FORM)
      setFormStep(1)
      fetchSales(page, status)
    } else {
      toast.error(res.error?.message || 'Gagal membuat penjualan')
    }
    setSaving(false)
  }

  const handleStatusFilter = (value: string | null) => {
    setStatus(!value || value === 'ALL' ? '' : value)
    setPage(1)
  }

  const columns: Column<Sale>[] = [
    { key: 'sale_number', label: 'Nomor Penjualan' },
    { key: 'batch_number', label: 'Batch' },
    {
      key: 'farmer',
      label: 'Pemilik Hasil Tani',
      render: (item) => item.farmer?.name || '-',
    },
    {
      key: 'representative',
      label: 'Pengantar',
      render: (item) => item.representative?.name || '-',
    },
    {
      key: 'commodity',
      label: 'Komoditas',
      render: (item) => {
        const name = item.commodity?.name || '-'
        const variant = item.commodity_variant?.name
        return variant ? `${name} - ${variant}` : name
      },
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
      key: 'total_amount',
      label: 'Total Nilai',
      render: (item) => item.total_amount ? formatRupiah(item.total_amount) : '-',
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDate(item.created_at),
    },
  ]

  return (
    <DashboardShell
      title="Penjualan"
      description="Kelola penjualan hasil tani"
      permission="farmer_sales.view"
    >
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="w-[220px]">
          <Select value={status || 'ALL'} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || 'ALL'} value={opt.value || 'ALL'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Penjualan
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
          <Link href={`/penjualan/${item.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" /> Lihat
            </Button>
          </Link>
        )}
        emptyMessage="Belum ada data penjualan."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Penjualan</DialogTitle>
            <DialogDescription>
              {formStep === 1 && 'Langkah 1 dari 3 - Pilih petani pemilik hasil tani.'}
              {formStep === 2 && 'Langkah 2 dari 3 - Pilih komoditas yang dijual.'}
              {formStep === 3 && 'Langkah 3 dari 3 - Masukkan detail berat dan catatan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Step 1: Pilih Petani */}
            {formStep === 1 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="cooperative_id">Koperasi</Label>
                  <Select
                    value={formData.cooperative_id}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      cooperative_id: v ?? '',
                      farmer_id: '',
                      representative_id: '',
                    })}
                  >
                    <SelectTrigger id="cooperative_id">
                      <SelectValue placeholder="Pilih koperasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperatives.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="farmer_id">Petani / Pemilik</Label>
                  <Select
                    value={formData.farmer_id}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      farmer_id: v ?? '',
                      representative_id: '',
                    })}
                  >
                    <SelectTrigger id="farmer_id">
                      <SelectValue placeholder="Pilih petani" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.farmer_number} - {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="representative_id">Pengantar (opsional)</Label>
                  <Select
                    value={formData.representative_id || 'NONE'}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      representative_id: (!v || v === 'NONE') ? '' : v,
                    })}
                  >
                    <SelectTrigger id="representative_id">
                      <SelectValue placeholder="Pilih pengantar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tidak ada pengantar</SelectItem>
                      {representatives.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.relationship_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Komoditas */}
            {formStep === 2 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="commodity_id">Komoditas</Label>
                  <Select
                    value={formData.commodity_id}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      commodity_id: v ?? '',
                      commodity_variant_id: '',
                    })}
                  >
                    <SelectTrigger id="commodity_id">
                      <SelectValue placeholder="Pilih komoditas" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {variants.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="commodity_variant_id">Varian (opsional)</Label>
                    <Select
                      value={formData.commodity_variant_id || 'NONE'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        commodity_variant_id: (!v || v === 'NONE') ? '' : v,
                      })}
                    >
                      <SelectTrigger id="commodity_variant_id">
                        <SelectValue placeholder="Pilih varian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tanpa varian</SelectItem>
                        {variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.code} - {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Detail */}
            {formStep === 3 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="initial_weight">Berat Awal (kg)</Label>
                  <Input
                    id="initial_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.initial_weight}
                    onChange={(e) => setFormData({ ...formData, initial_weight: e.target.value })}
                    placeholder="Masukkan berat awal"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="received_weight">Berat Diterima (kg)</Label>
                  <Input
                    id="received_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.received_weight}
                    onChange={(e) => setFormData({ ...formData, received_weight: e.target.value })}
                    placeholder="Masukkan berat diterima"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tambahkan catatan jika ada"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            {formStep > 1 && (
              <Button variant="outline" onClick={() => setFormStep(formStep - 1)}>
                Kembali
              </Button>
            )}
            {formStep < 3 ? (
              <Button
                onClick={() => setFormStep(formStep + 1)}
                disabled={
                  (formStep === 1 && !formData.farmer_id) ||
                  (formStep === 2 && !formData.commodity_id)
                }
              >
                Lanjut
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !formData.received_weight}
              >
                {saving ? 'Menyimpan...' : 'Simpan Penjualan'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
