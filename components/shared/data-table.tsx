'use client'

import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  limit?: number
  loading?: boolean
  searchPlaceholder?: string
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  onExport?: () => void
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  total = 0,
  page = 1,
  limit = 20,
  loading = false,
  searchPlaceholder = 'Cari...',
  onPageChange,
  onSearch,
  onExport,
  actions,
  emptyMessage = 'Tidak ada data.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const totalPages = Math.ceil(total / limit)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    onSearch?.(search)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {onSearch && (
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Cari</Button>
          </form>
        )}
        <div className="flex-1" />
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" /> Ekspor CSV
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
              ))}
              {actions && <TableHead className="w-[100px]">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                  {actions && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow key={(item as any).id || idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </TableCell>
                  ))}
                  {actions && <TableCell>{actions(item)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} dari {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Halaman {page} dari {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
