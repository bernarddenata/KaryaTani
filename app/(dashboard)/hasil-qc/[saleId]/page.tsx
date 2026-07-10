'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/utils/api-client'
import {
  formatWeight, formatDateTime,
  STATUS_LABELS, STATUS_COLORS,
} from '@/lib/utils/format'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { ImageUpload } from '@/components/shared/image-upload'

/* ---------- types ---------- */

interface QcTemplateItem {
  id: string
  item_name: string
  input_type: 'ANGKA' | 'PERSENTASE' | 'PILIHAN' | 'CHECKLIST' | 'YA_TIDAK' | 'FOTO' | 'CATATAN'
  help_text?: string
  is_required: boolean
  options_json?: string[]
  sort_order: number
}

interface QcResultItem {
  id: string
  qc_template_item_id: string
  item_name: string
  value_text?: string
  value_number?: number | string
  value_json?: any
  notes?: string
}

interface ExistingGradeBreakdown {
  grade_name: string
  grade_code: string
  weight: number | string
  reason?: string
}

interface ExistingQcResult {
  id: string
  status: string
  final_grade_code?: string
  total_weight_checked?: string
  final_accepted_weight?: string
  total_rejected_weight?: string
  notes?: string
  items?: QcResultItem[]
  grade_breakdowns?: ExistingGradeBreakdown[]
}

interface SaleDetail {
  id: string
  sale_number: string
  batch_number: string
  status: string
  received_weight?: string
  farmer: { id: string; name: string; farmer_number: string }
  commodity: { id: string; name: string; code: string }
  commodity_variant?: { id: string; name: string } | null
  cooperative: { id: string; name: string }
  qc_template?: { id: string; name: string } | null
  qc_results: ExistingQcResult[]
}

interface QcTemplateDetail {
  id: string
  name: string
  items: QcTemplateItem[]
}

/* ---------- form state types ---------- */

interface ItemValue {
  qc_template_item_id: string
  value_text: string
  value_number: string
  value_json: any
  notes: string
}

interface GradeRow {
  grade_name: string
  grade_code: string
  weight: string
  reason: string
}

const DEFAULT_GRADES: GradeRow[] = [
  { grade_name: 'Grade A', grade_code: 'A', weight: '', reason: '' },
  { grade_name: 'Grade B', grade_code: 'B', weight: '', reason: '' },
  { grade_name: 'Grade C', grade_code: 'C', weight: '', reason: '' },
  { grade_name: 'Reject', grade_code: 'REJECT', weight: '', reason: '' },
]

/* ---------- component ---------- */

export default function HasilQcFormPage() {
  const params = useParams()
  const router = useRouter()
  const saleId = params.saleId as string

  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [templateItems, setTemplateItems] = useState<QcTemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // QC has been started (sale status is QC_DIPROSES or we have qc_results)
  const [qcStarted, setQcStarted] = useState(false)

  // Form state
  const [itemValues, setItemValues] = useState<Record<string, ItemValue>>({})
  const [grades, setGrades] = useState<GradeRow[]>(DEFAULT_GRADES)
  const [finalGrade, setFinalGrade] = useState('')
  const [qcNotes, setQcNotes] = useState('')

  /* -- fetch sale detail -- */

  const fetchSale = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<SaleDetail>(`/api/farmer-sales/${saleId}`)
      if (res.success && res.data) {
        setSale(res.data)
        const s = res.data

        // If QC is already started or has results
        if (
          s.status === 'QC_DIPROSES' ||
          s.status === 'QC_SELESAI' ||
          (s.qc_results && s.qc_results.length > 0)
        ) {
          setQcStarted(true)

          // Pre-fill from existing QC result
          const existingQc = s.qc_results?.[0]
          if (existingQc) {
            if (existingQc.final_grade_code) setFinalGrade(existingQc.final_grade_code)
            if (existingQc.notes) setQcNotes(existingQc.notes)

            // Pre-fill item values
            if (existingQc.items && existingQc.items.length > 0) {
              const prefilled: Record<string, ItemValue> = {}
              existingQc.items.forEach((item) => {
                prefilled[item.qc_template_item_id] = {
                  qc_template_item_id: item.qc_template_item_id,
                  value_text: item.value_text || '',
                  value_number: item.value_number != null ? String(item.value_number) : '',
                  value_json: item.value_json,
                  notes: item.notes || '',
                }
              })
              setItemValues(prefilled)
            }

            // Pre-fill grade breakdowns
            if (existingQc.grade_breakdowns && existingQc.grade_breakdowns.length > 0) {
              setGrades(
                existingQc.grade_breakdowns.map((gb) => ({
                  grade_name: gb.grade_name,
                  grade_code: gb.grade_code,
                  weight: gb.weight != null ? String(gb.weight) : '',
                  reason: gb.reason || '',
                }))
              )
            }
          }
        }

        // Fetch QC template items
        if (s.qc_template?.id) {
          const tmplRes = await apiFetch<QcTemplateDetail>(
            `/api/qc-templates/${s.qc_template.id}`
          )
          if (tmplRes.success && tmplRes.data) {
            const items = tmplRes.data.items || []
            items.sort((a, b) => a.sort_order - b.sort_order)
            setTemplateItems(items)
          }
        }
      }
    } catch {
      toast.error('Gagal memuat data penjualan')
    } finally {
      setLoading(false)
    }
  }, [saleId])

  useEffect(() => {
    if (saleId) fetchSale()
  }, [saleId, fetchSale])

  /* -- start QC -- */

  const handleStartQc = async () => {
    setStarting(true)
    const res = await apiFetch(`/api/qc/${saleId}/start`, { method: 'POST' })
    if (res.success) {
      toast.success('QC berhasil dimulai')
      setQcStarted(true)
      fetchSale()
    } else {
      toast.error(res.error?.message || 'Gagal memulai QC')
    }
    setStarting(false)
  }

  /* -- item value helpers -- */

  const getItemValue = (itemId: string): ItemValue => {
    return (
      itemValues[itemId] || {
        qc_template_item_id: itemId,
        value_text: '',
        value_number: '',
        value_json: null,
        notes: '',
      }
    )
  }

  const setItemField = (itemId: string, field: keyof ItemValue, value: any) => {
    setItemValues((prev) => ({
      ...prev,
      [itemId]: {
        ...getItemValue(itemId),
        qc_template_item_id: itemId,
        [field]: value,
      },
    }))
  }

  /* -- grade helpers -- */

  const updateGrade = (index: number, field: keyof GradeRow, value: string) => {
    setGrades((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    )
  }

  const totalGradeWeight = grades.reduce((sum, g) => {
    const w = parseFloat(g.weight)
    return sum + (isNaN(w) ? 0 : w)
  }, 0)

  const receivedWeight = sale?.received_weight
    ? parseFloat(sale.received_weight)
    : 0
  const weightOverflow = totalGradeWeight > receivedWeight && receivedWeight > 0

  /* -- submit -- */

  const handleSubmit = async () => {
    if (!finalGrade) {
      toast.error('Pilih grade akhir terlebih dahulu')
      return
    }

    setSubmitting(true)

    const items = templateItems.map((ti) => {
      const val = getItemValue(ti.id)
      return {
        qc_template_item_id: ti.id,
        value_text: val.value_text || null,
        value_number: val.value_number ? parseFloat(val.value_number) : null,
        value_json: val.value_json || null,
        notes: val.notes || null,
      }
    })

    const grade_breakdowns = grades
      .filter((g) => g.weight && parseFloat(g.weight) > 0)
      .map((g) => ({
        grade_name: g.grade_name,
        grade_code: g.grade_code,
        weight: parseFloat(g.weight),
        reason: g.reason || null,
      }))

    const body = {
      final_grade_code: finalGrade,
      notes: qcNotes || null,
      items,
      grade_breakdowns,
    }

    const res = await apiFetch(`/api/qc/${saleId}/submit`, {
      method: 'POST',
      body,
    })
    if (res.success) {
      toast.success('Hasil QC berhasil disimpan')
      router.push(`/penjualan/${saleId}`)
    } else {
      toast.error(res.error?.message || 'Gagal menyimpan hasil QC')
    }
    setSubmitting(false)
  }

  /* ---------- render ---------- */

  return (
    <DashboardShell
      title="Formulir QC"
      description="Pemeriksaan kualitas hasil tani"
      permission="qc_results.create"
    >
      {/* Back */}
      <div className="mb-4">
        <Link href={`/penjualan/${saleId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Detail Penjualan
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !sale ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Data penjualan tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ---- Sale Info ---- */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nomor Penjualan</p>
                  <p className="font-medium">{sale.sale_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pemilik</p>
                  <p className="font-medium">{sale.farmer?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Komoditas</p>
                  <p className="font-medium">
                    {sale.commodity?.name || '-'}
                    {sale.commodity_variant
                      ? ` - ${sale.commodity_variant.name}`
                      : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Berat Diterima</p>
                  <p className="font-medium">
                    {formatWeight(sale.received_weight)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  className={
                    STATUS_COLORS[sale.status] || 'bg-gray-100 text-gray-800'
                  }
                >
                  {STATUS_LABELS[sale.status] || sale.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ---- Start QC (if not started) ---- */}
          {!qcStarted &&
            (sale.status === 'MENUNGGU_QC' ||
              sale.status === 'DITERIMA_KOPERASI') && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 mb-4">
                    QC belum dimulai untuk penjualan ini. Klik tombol di bawah
                    untuk memulai proses QC.
                  </p>
                  <Button
                    className="bg-primary hover:bg-brand-dark text-white"
                    onClick={handleStartQc}
                    disabled={starting}
                  >
                    {starting ? 'Memulai QC...' : 'Mulai QC'}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* ---- QC Form (if started) ---- */}
          {qcStarted && (
            <>
              {/* ---- Template Items ---- */}
              {templateItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Item Pemeriksaan</CardTitle>
                    {sale.qc_template && (
                      <p className="text-sm text-gray-500">
                        Template: {sale.qc_template.name}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {templateItems.map((item) => {
                      const val = getItemValue(item.id)
                      return (
                        <div key={item.id} className="space-y-1.5">
                          <Label>
                            {item.item_name}
                            {item.is_required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          {item.help_text && (
                            <p className="text-xs text-gray-400">
                              {item.help_text}
                            </p>
                          )}

                          {/* ANGKA */}
                          {item.input_type === 'ANGKA' && (
                            <Input
                              type="number"
                              value={val.value_number}
                              onChange={(e) =>
                                setItemField(
                                  item.id,
                                  'value_number',
                                  e.target.value
                                )
                              }
                              placeholder="Masukkan angka"
                            />
                          )}

                          {/* PERSENTASE */}
                          {item.input_type === 'PERSENTASE' && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={val.value_number}
                                onChange={(e) =>
                                  setItemField(
                                    item.id,
                                    'value_number',
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="max-w-[120px]"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          )}

                          {/* PILIHAN */}
                          {item.input_type === 'PILIHAN' && (
                            <Select
                              value={val.value_text}
                              onValueChange={(v) =>
                                setItemField(item.id, 'value_text', v ?? '')
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih opsi" />
                              </SelectTrigger>
                              <SelectContent>
                                {(item.options_json || []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* CHECKLIST */}
                          {item.input_type === 'CHECKLIST' && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={val.value_text === 'true'}
                                onCheckedChange={(checked) =>
                                  setItemField(
                                    item.id,
                                    'value_text',
                                    checked === true ? 'true' : 'false'
                                  )
                                }
                              />
                              <span className="text-sm">{item.item_name}</span>
                            </div>
                          )}

                          {/* YA_TIDAK */}
                          {item.input_type === 'YA_TIDAK' && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  val.value_text === 'Ya'
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() =>
                                  setItemField(item.id, 'value_text', 'Ya')
                                }
                              >
                                Ya
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  val.value_text === 'Tidak'
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() =>
                                  setItemField(item.id, 'value_text', 'Tidak')
                                }
                              >
                                Tidak
                              </Button>
                            </div>
                          )}

                          {/* FOTO */}
                          {item.input_type === 'FOTO' && (
                            <ImageUpload
                              value={val.value_text || null}
                              onUploaded={(fileUrl) =>
                                setItemField(item.id, 'value_text', fileUrl)
                              }
                              onRemoved={() =>
                                setItemField(item.id, 'value_text', '')
                              }
                              entityType="QcResult"
                              entityId={saleId}
                              disabled={sale?.status === 'QC_SELESAI'}
                            />
                          )}

                          {/* CATATAN */}
                          {item.input_type === 'CATATAN' && (
                            <Textarea
                              value={val.value_text}
                              onChange={(e) =>
                                setItemField(
                                  item.id,
                                  'value_text',
                                  e.target.value
                                )
                              }
                              placeholder="Tulis catatan..."
                              rows={3}
                            />
                          )}

                          {/* Per-item notes (for non-CATATAN types) */}
                          {item.input_type !== 'CATATAN' && (
                            <Input
                              value={val.notes}
                              onChange={(e) =>
                                setItemField(item.id, 'notes', e.target.value)
                              }
                              placeholder="Catatan item (opsional)"
                              className="text-sm"
                            />
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* ---- Grade Breakdown ---- */}
              <Card>
                <CardHeader>
                  <CardTitle>Rincian Grade</CardTitle>
                  <p className="text-sm text-gray-500">
                    Berat diterima: {formatWeight(sale.received_weight)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Grade</TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Berat (kg)</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grades.map((g, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Input
                                value={g.grade_name}
                                onChange={(e) =>
                                  updateGrade(i, 'grade_name', e.target.value)
                                }
                                placeholder="Nama grade"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={g.grade_code}
                                onChange={(e) =>
                                  updateGrade(i, 'grade_code', e.target.value)
                                }
                                placeholder="Kode"
                                className="max-w-[100px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={g.weight}
                                onChange={(e) =>
                                  updateGrade(i, 'weight', e.target.value)
                                }
                                placeholder="0"
                                className="max-w-[120px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={g.reason}
                                onChange={(e) =>
                                  updateGrade(i, 'reason', e.target.value)
                                }
                                placeholder="Keterangan"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          weightOverflow ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        Total berat grade:{' '}
                        {totalGradeWeight.toLocaleString('id-ID')} kg /{' '}
                        {receivedWeight.toLocaleString('id-ID')} kg (berat
                        diterima)
                      </p>
                      {weightOverflow && (
                        <p className="text-xs text-red-500 mt-1">
                          Total berat grade melebihi berat diterima!
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setGrades([
                          ...grades,
                          {
                            grade_name: '',
                            grade_code: '',
                            weight: '',
                            reason: '',
                          },
                        ])
                      }
                    >
                      + Tambah Baris
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ---- Final Grade + Notes ---- */}
              <Card>
                <CardHeader>
                  <CardTitle>Kesimpulan QC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 max-w-sm">
                    <Label>
                      Grade Akhir <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={finalGrade}
                      onValueChange={(v) => setFinalGrade(v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih grade akhir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Grade A</SelectItem>
                        <SelectItem value="B">Grade B</SelectItem>
                        <SelectItem value="C">Grade C</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Catatan QC</Label>
                    <Textarea
                      value={qcNotes}
                      onChange={(e) => setQcNotes(e.target.value)}
                      placeholder="Catatan tambahan hasil QC..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <Button
                      className="bg-primary hover:bg-brand-dark text-white"
                      onClick={handleSubmit}
                      disabled={submitting || !finalGrade}
                    >
                      {submitting ? 'Menyimpan...' : 'Simpan Hasil QC'}
                    </Button>
                    <Link href={`/penjualan/${saleId}`}>
                      <Button variant="outline">Batal</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
