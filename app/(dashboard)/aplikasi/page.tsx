'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/utils/api-client'
import { formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Smartphone, Upload, Copy, Download, ExternalLink } from 'lucide-react'

interface AppRelease {
  slug: string
  name: string
  description: string
  audience: string
  available: boolean
  file_name: string | null
  file_size: number | null
  uploaded_at: string | null
  download_url: string
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function AplikasiPage() {
  const [apps, setApps] = useState<AppRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchApps = useCallback(async () => {
    setLoading(true)
    const res = await apiFetch('/api/apps')
    if (res.success) setApps(res.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  const handleUpload = async (slug: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      toast.error('Hanya file .apk yang diperbolehkan.')
      return
    }
    setUploading(slug)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`/api/apps/${slug}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('APK berhasil diunggah. Link unduhan siap dibagikan.')
        fetchApps()
      } else {
        toast.error(json.error?.message || 'Gagal mengunggah APK.')
      }
    } catch {
      toast.error('Gagal mengunggah APK. Periksa koneksi Anda.')
    }
    setUploading(null)
  }

  const copyLink = (url: string) => {
    const full = `${window.location.origin}${url}`
    navigator.clipboard.writeText(full)
    toast.success('Link unduhan disalin.')
  }

  return (
    <DashboardShell
      title="Aplikasi Mobile"
      description="Unggah file APK dan bagikan link unduhan ke petani dan petugas koperasi."
      permission="settings.view"
    >
      <div className="mb-4 rounded-lg bg-brand-light p-3 text-sm">
        Halaman unduhan publik:{' '}
        <a href="/download" target="_blank" className="font-semibold text-primary underline inline-flex items-center gap-1">
          karyatani.com/download <ExternalLink className="h-3.5 w-3.5" />
        </a>{' '}
        — bagikan link ini agar petani/petugas dapat mengunduh aplikasi tanpa login.
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Card key={app.slug}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-primary">
                    <Smartphone className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{app.audience}</p>
                  </div>
                  <div className="ml-auto">
                    {app.available ? (
                      <Badge className="bg-primary/15 text-primary">Tersedia</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Belum Ada APK</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{app.description}</p>

                <div className="rounded-lg border p-3 text-sm space-y-1">
                  {app.available ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">File</span>
                        <span className="font-mono text-xs">{app.file_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ukuran</span>
                        <span>{formatSize(app.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diunggah</span>
                        <span>{app.uploaded_at ? formatDateTime(app.uploaded_at) : '-'}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Belum ada APK yang diunggah. Unggah file .apk untuk mengaktifkan link unduhan.
                    </p>
                  )}
                </div>

                <input
                  type="file"
                  accept=".apk"
                  className="hidden"
                  ref={(el) => { fileInputs.current[app.slug] = el }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(app.slug, f)
                    e.target.value = ''
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => fileInputs.current[app.slug]?.click()}
                    disabled={uploading === app.slug}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading === app.slug
                      ? 'Mengunggah...'
                      : app.available ? 'Ganti APK' : 'Unggah APK'}
                  </Button>
                  {app.available && (
                    <>
                      <Button variant="outline" onClick={() => copyLink(app.download_url)}>
                        <Copy className="h-4 w-4 mr-1" /> Salin Link
                      </Button>
                      <a href={app.download_url}>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-1" /> Unduh
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
