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

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-cyan-100 text-cyan-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  AKTIF: 'bg-cyan-100 text-cyan-800',
  NONAKTIF: 'bg-gray-100 text-gray-800',
  KEDALUWARSA: 'bg-orange-100 text-orange-800',
  TERVERIFIKASI: 'bg-cyan-100 text-cyan-800',
  BELUM_DIVERIFIKASI: 'bg-yellow-100 text-yellow-800',
  MENUNGGU_VERIFIKASI: 'bg-blue-100 text-blue-800',
  DITOLAK: 'bg-red-100 text-red-800',
  MENUNGGU_QC: 'bg-yellow-100 text-yellow-800',
  QC_DIPROSES: 'bg-blue-100 text-blue-800',
  QC_SELESAI: 'bg-cyan-100 text-cyan-800',
  HARGA_DIHITUNG: 'bg-cyan-100 text-cyan-800',
  MENUNGGU_PEMBAYARAN: 'bg-orange-100 text-orange-800',
  DIBAYAR: 'bg-cyan-100 text-cyan-800',
  KEBERATAN: 'bg-red-100 text-red-800',
  DIBATALKAN: 'bg-gray-100 text-gray-800',
  DIKIRIM: 'bg-blue-100 text-blue-800',
  DISETUJUI: 'bg-cyan-100 text-cyan-800',
  DALAM_REVIEW: 'bg-yellow-100 text-yellow-800',
  SELESAI: 'bg-cyan-100 text-cyan-800',
  BELUM_DIBAYAR: 'bg-orange-100 text-orange-800',
  SUDAH_DITRANSFER: 'bg-cyan-100 text-cyan-800',
  GAGAL_TRANSFER: 'bg-red-100 text-red-800',
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
