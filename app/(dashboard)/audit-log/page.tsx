'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { DataTable, Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDateTime } from '@/lib/utils/format'
import { Eye, Filter } from 'lucide-react'

interface AuditLog {
  id: string
  created_at: string
  actor?: { name: string }
  entity_type: string
  entity_id: string
  action: string
  source_client?: string
  ip_address?: string
  before_json?: Record<string, unknown>
  after_json?: Record<string, unknown>
}

const ENTITY_TYPES = [
  'USER',
  'FARMER',
  'COOPERATIVE',
  'COMMODITY',
  'FARMER_SALE',
  'QC_RESULT',
  'FARMER_PAYOUT',
  'DISPUTE',
  'PRICE_LIST',
  'QC_TEMPLATE',
]

const SOURCE_CLIENTS = ['WEB', 'MOBILE_QC', 'MOBILE_FARMER', 'API', 'SYSTEM']

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-cyan-100 text-cyan-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  RESOLVE: 'bg-purple-100 text-purple-800',
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detailItem, setDetailItem] = useState<AuditLog | null>(null)

  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [sourceClient, setSourceClient] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (entityType) params.set('entity_type', entityType)
    if (action) params.set('action', action)
    if (sourceClient) params.set('source_client', sourceClient)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)

    const res = await apiFetch(`/api/audit-logs?${params.toString()}`)
    if (res.success) {
      setData(res.data || [])
      setTotal(res.meta?.total || res.data?.length || 0)
    }
    setLoading(false)
  }, [entityType, action, sourceClient, dateFrom, dateTo])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const handleFilter = () => {
    setPage(1)
    fetchData(1)
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      render: (item) => formatDateTime(item.created_at),
    },
    {
      key: 'actor',
      label: 'User',
      render: (item) => item.actor?.name || 'Sistem',
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (item) => (
        <Badge className={ACTION_COLORS[item.action] || 'bg-gray-100 text-gray-800'}>
          {item.action}
        </Badge>
      ),
    },
    { key: 'entity_type', label: 'Entity' },
    {
      key: 'entity_id',
      label: 'Entity ID',
      render: (item) => (
        <span className="font-mono text-xs">{item.entity_id?.substring(0, 8) || '-'}</span>
      ),
    },
    {
      key: 'source_client',
      label: 'Source',
      render: (item) => item.source_client || '-',
    },
    {
      key: 'ip_address',
      label: 'IP',
      render: (item) => (
        <span className="font-mono text-xs">{item.ip_address || '-'}</span>
      ),
    },
  ]

  return (
    <DashboardShell
      title="Audit Log"
      description="Lihat catatan aktivitas pengguna dan perubahan data dalam sistem."
      permission="audit_logs.view"
    >
      {/* Filter Section */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="grid gap-1.5">
          <Label className="text-xs">Tipe Entitas</Label>
          <Select
            value={entityType}
            onValueChange={(v) => setEntityType(v === '_all' ? '' : (v ?? ''))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Entitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Entitas</SelectItem>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Aksi</Label>
          <Input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Contoh: CREATE"
            className="w-[160px]"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Sumber</Label>
          <Select
            value={sourceClient}
            onValueChange={(v) => setSourceClient(v === '_all' ? '' : (v ?? ''))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Sumber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Sumber</SelectItem>
              {SOURCE_CLIENTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Dari Tanggal</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Sampai Tanggal</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Button onClick={handleFilter} size="sm">
          <Filter className="h-4 w-4 mr-1" /> Filter
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        loading={loading}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)}>
            <Eye className="h-4 w-4 mr-1" /> Detail
          </Button>
        )}
        emptyMessage="Tidak ada catatan audit."
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Audit Log</DialogTitle>
            <DialogDescription>
              {detailItem?.action} pada {detailItem?.entity_type} - {formatDateTime(detailItem?.created_at)}
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{detailItem.actor?.name || 'Sistem'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aksi</p>
                  <Badge className={ACTION_COLORS[detailItem.action] || 'bg-gray-100 text-gray-800'}>
                    {detailItem.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity</p>
                  <p className="font-medium">{detailItem.entity_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-xs">{detailItem.entity_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sumber</p>
                  <p className="font-medium">{detailItem.source_client || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono text-xs">{detailItem.ip_address || '-'}</p>
                </div>
              </div>

              {detailItem.before_json && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Data Sebelum</p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(detailItem.before_json, null, 2)}
                  </pre>
                </div>
              )}

              {detailItem.after_json && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Data Sesudah</p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(detailItem.after_json, null, 2)}
                  </pre>
                </div>
              )}

              {!detailItem.before_json && !detailItem.after_json && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada data perubahan yang tersedia.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
