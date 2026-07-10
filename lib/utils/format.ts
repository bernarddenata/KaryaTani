export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'Rp0'
  return 'Rp' + num.toLocaleString('id-ID')
}

export function formatWeight(weight: number | string | null | undefined): string {
  if (weight === null || weight === undefined) return '0 kg'
  const num = typeof weight === 'string' ? parseFloat(weight) : weight
  if (isNaN(num)) return '0 kg'
  return num.toLocaleString('id-ID') + ' kg'
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Nonaktif',
  DRAFT: 'Draft',
  AKTIF: 'Aktif',
  NONAKTIF: 'Nonaktif',
  KEDALUWARSA: 'Kedaluwarsa',
  ARSIP: 'Arsip',
  BELUM_DIVERIFIKASI: 'Belum Diverifikasi',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  TERVERIFIKASI: 'Terverifikasi',
  DITOLAK: 'Ditolak',
  DITERIMA_KOPERASI: 'Diterima Koperasi',
  MENUNGGU_QC: 'Menunggu QC',
  QC_DIPROSES: 'QC Diproses',
  QC_SELESAI: 'QC Selesai',
  HARGA_DIHITUNG: 'Harga Dihitung',
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  DIBAYAR: 'Dibayar',
  KEBERATAN: 'Keberatan',
  DIBATALKAN: 'Dibatalkan',
  DIKIRIM: 'Dikirim',
  DISETUJUI: 'Disetujui',
  DIKOREKSI: 'Dikoreksi',
  DALAM_REVIEW: 'Dalam Review',
  PERLU_QC_ULANG: 'Perlu QC Ulang',
  SELESAI: 'Selesai',
  BELUM_DIBAYAR: 'Belum Dibayar',
  MENUNGGU_TRANSFER: 'Menunggu Transfer',
  SUDAH_DITRANSFER: 'Sudah Ditransfer',
  GAGAL_TRANSFER: 'Gagal Transfer',
}

// Status badge recipe (design-tokens.md §5): bg = color @ ~15% alpha, fg = color.
const BADGE_SUCCESS = 'bg-primary/15 text-primary'
const BADGE_WARNING = 'bg-warning/20 text-[#8A6414]'
const BADGE_ORANGE = 'bg-orange/15 text-[#A05E12]'
const BADGE_DANGER = 'bg-destructive/15 text-destructive'
const BADGE_INFO = 'bg-info/15 text-info'
const BADGE_MUTED = 'bg-muted text-muted-foreground'

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: BADGE_SUCCESS,
  INACTIVE: BADGE_MUTED,
  DRAFT: BADGE_MUTED,
  AKTIF: BADGE_SUCCESS,
  NONAKTIF: BADGE_MUTED,
  KEDALUWARSA: BADGE_ORANGE,
  ARSIP: BADGE_MUTED,
  TERVERIFIKASI: BADGE_SUCCESS,
  BELUM_DIVERIFIKASI: BADGE_WARNING,
  MENUNGGU_VERIFIKASI: BADGE_INFO,
  DITOLAK: BADGE_DANGER,
  DITERIMA_KOPERASI: BADGE_INFO,
  MENUNGGU_QC: BADGE_WARNING,
  QC_DIPROSES: BADGE_INFO,
  QC_SELESAI: BADGE_SUCCESS,
  HARGA_DIHITUNG: BADGE_SUCCESS,
  MENUNGGU_PEMBAYARAN: BADGE_ORANGE,
  DIBAYAR: BADGE_SUCCESS,
  KEBERATAN: BADGE_DANGER,
  DIBATALKAN: BADGE_MUTED,
  DIKIRIM: BADGE_INFO,
  DISETUJUI: BADGE_SUCCESS,
  DIKOREKSI: BADGE_ORANGE,
  DALAM_REVIEW: BADGE_WARNING,
  PERLU_QC_ULANG: BADGE_ORANGE,
  SELESAI: BADGE_SUCCESS,
  BELUM_DIBAYAR: BADGE_ORANGE,
  MENUNGGU_TRANSFER: BADGE_WARNING,
  SUDAH_DITRANSFER: BADGE_SUCCESS,
  GAGAL_TRANSFER: BADGE_DANGER,
}

export const SELLER_TYPE_LABELS: Record<string, string> = {
  PEMILIK_LAHAN: 'Pemilik Lahan',
  PENGGARAP: 'Penggarap',
  PENYEWA_LAHAN: 'Penyewa Lahan',
  KELOMPOK_TANI: 'Kelompok Tani',
  BADAN_USAHA: 'Badan Usaha',
  PENGEPUL_TERVERIFIKASI: 'Pengepul Terverifikasi',
  LAINNYA: 'Lainnya',
}

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  PEGAWAI: 'Pegawai',
  KELUARGA: 'Keluarga',
  SOPIR: 'Sopir',
  BURUH_TANI: 'Buruh Tani',
  KETUA_KELOMPOK: 'Ketua Kelompok',
  KUASA: 'Kuasa',
  LAINNYA: 'Lainnya',
}

export const MUTATION_TYPE_LABELS: Record<string, string> = {
  HASIL_PENJUALAN: 'Hasil Penjualan',
  PEMBAYARAN_TRANSFER: 'Pembayaran / Transfer',
  KOREKSI: 'Koreksi',
  PEMBATALAN: 'Pembatalan',
  PENYESUAIAN_KEBERATAN: 'Penyesuaian Keberatan',
}

export const DISPUTE_REASON_LABELS: Record<string, string> = {
  BERAT_TIDAK_SESUAI: 'Berat Tidak Sesuai',
  GRADE_TIDAK_SESUAI: 'Grade Tidak Sesuai',
  BERAT_REJECT_TIDAK_SESUAI: 'Berat Reject Tidak Sesuai',
  HARGA_TIDAK_SESUAI: 'Harga Tidak Sesuai',
  PEMBAYARAN_TIDAK_SESUAI: 'Pembayaran Tidak Sesuai',
  LAINNYA: 'Lainnya',
}

export const PAYOUT_METHOD_LABELS: Record<string, string> = {
  TRANSFER_BANK: 'Transfer Bank',
  TUNAI: 'Tunai',
  LAINNYA: 'Lainnya',
}
