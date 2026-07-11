import path from 'path'

export interface AppSlot {
  slug: string
  name: string
  description: string
  audience: string
}

export const APP_SLOTS: AppSlot[] = [
  {
    slug: 'karya-taniku',
    name: 'Karya Taniku',
    description: 'Aplikasi untuk petani: pantau setoran, hasil QC, estimasi pembayaran, dan kartu anggota digital.',
    audience: 'Petani / Anggota Koperasi',
  },
  {
    slug: 'karya-tani-qc',
    name: 'Karya Tani QC',
    description: 'Aplikasi untuk petugas koperasi: terima setoran, proses QC, grading, dan estimasi pembayaran.',
    audience: 'Petugas QC Koperasi',
  },
]

export function getSlot(slug: string): AppSlot | undefined {
  return APP_SLOTS.find((s) => s.slug === slug)
}

export const APK_DIR = path.join(process.cwd(), 'uploads', 'apk')
export const APK_ENTITY_TYPE = 'ApkRelease'
export const MAX_APK_SIZE = 300 * 1024 * 1024 // 300MB
