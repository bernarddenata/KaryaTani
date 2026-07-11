import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma/client'
import { APP_SLOTS, APK_DIR, APK_ENTITY_TYPE } from '@/lib/apps/slots'
import { Download, Smartphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Unduh Aplikasi — Karya Tani Center',
  description: 'Unduh aplikasi Karya Taniku untuk petani dan Karya Tani QC untuk petugas koperasi.',
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default async function DownloadPage() {
  const releases = await prisma.fileUpload.findMany({
    where: { entity_type: APK_ENTITY_TYPE },
    orderBy: { created_at: 'desc' },
  })

  const apps = APP_SLOTS.map((slot) => {
    const latest = releases.find((r) => r.entity_id === slot.slug)
    const exists = latest && fs.existsSync(path.join(APK_DIR, `${slot.slug}.apk`))
    return { ...slot, available: Boolean(exists), file_size: latest?.file_size, uploaded_at: latest?.created_at }
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-dark px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D25] via-[#1F6B3A] to-[#2E7A47]" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,185,66,0.35)_0%,_transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Karya Tani Center" className="mx-auto h-20 w-20 rounded-full bg-white object-contain p-1 shadow-lg" />
          <h1 className="mt-4 text-2xl font-extrabold text-white">Unduh Aplikasi</h1>
          <p className="mt-1 text-sm text-white/80">
            Aplikasi mobile resmi Karya Tani Center untuk petani dan petugas koperasi.
          </p>
        </div>

        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.slug} className="rounded-2xl border border-white/10 bg-white p-5 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-primary">
                  <Smartphone className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-brand-dark">{app.name}</h2>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {app.audience}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{app.description}</p>

                  <div className="mt-4">
                    {app.available ? (
                      <a
                        href={`/api/apps/${app.slug}/download`}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
                      >
                        <Download className="size-4" />
                        Unduh APK
                        {app.file_size ? (
                          <span className="font-medium text-white/75">({formatSize(app.file_size)})</span>
                        ) : null}
                      </a>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                        Segera Hadir
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/15 bg-white/10 p-4 text-xs leading-relaxed text-white/80">
          <p className="font-semibold text-white">Cara memasang:</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>Unduh file APK di atas melalui ponsel Android Anda.</li>
            <li>Buka file yang terunduh, lalu izinkan pemasangan dari sumber tidak dikenal jika diminta.</li>
            <li>Ikuti petunjuk pemasangan sampai selesai, lalu buka aplikasinya.</li>
          </ol>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          Karya Tani Center — Koperasi Desa/Kelurahan Merah Putih
        </p>
      </div>
    </div>
  )
}
