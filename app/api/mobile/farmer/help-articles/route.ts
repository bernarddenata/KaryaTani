import { NextRequest } from 'next/server'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/**
 * Artikel bantuan / FAQ untuk aplikasi Karya Taniku.
 * Konten dikelola server-side sehingga bisa diperbarui tanpa rilis APK.
 */
const HELP_ARTICLES = [
  {
    id: 'setoran',
    title: 'Bagaimana cara menyetor hasil panen?',
    body: 'Bawa hasil panen Anda ke koperasi. Tunjukkan Kartu Anggota digital (QR) di aplikasi kepada petugas. Petugas akan menimbang dan mencatat setoran Anda — setelah itu setoran langsung muncul di aplikasi.',
    order: 1,
  },
  {
    id: 'qc',
    title: 'Apa itu pemeriksaan mutu (QC)?',
    body: 'Setiap setoran diperiksa mutunya oleh petugas koperasi: berat, kondisi, dan kualitas. Hasilnya dibagi per grade (A/B/C/Reject) dan bisa Anda lihat lengkap di menu Setoran, termasuk alasan penilaiannya.',
    order: 2,
  },
  {
    id: 'pembayaran',
    title: 'Kapan saya menerima pembayaran?',
    body: 'Setelah QC selesai, sistem menghitung estimasi pembayaran sesuai daftar harga koperasi. Saldo Anda tercatat di koperasi dan dibayarkan oleh staff keuangan sesuai jadwal koperasi. Riwayat pembayaran dapat dilihat di aplikasi.',
    order: 3,
  },
  {
    id: 'keberatan',
    title: 'Bagaimana jika saya tidak setuju dengan hasil QC?',
    body: 'Buka detail setoran, lalu pilih "Ajukan Keberatan". Sampaikan alasan Anda dan lampirkan foto bukti jika ada. Pengurus koperasi akan meninjau dan memberi keputusan yang bisa Anda pantau di menu Keberatan.',
    order: 4,
  },
  {
    id: 'pin',
    title: 'Lupa PIN atau ingin mengganti PIN?',
    body: 'PIN dapat diganti di menu Profil. Jika lupa PIN, hubungi pengurus koperasi Anda untuk direset.',
    order: 5,
  },
  {
    id: 'kontak',
    title: 'Bagaimana menghubungi koperasi?',
    body: 'Informasi alamat dan kontak koperasi Anda tersedia di menu Profil > Koperasi Saya. Anda juga dapat berkunjung langsung ke kantor koperasi pada jam kerja.',
    order: 6,
  },
]

export async function GET(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()
    return successResponse(HELP_ARTICLES)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
