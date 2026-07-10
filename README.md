# Karya Tani Center

Platform pencatatan penjualan hasil tani dari petani ke koperasi.

## Tentang

Karya Tani Center adalah platform web untuk mencatat proses penjualan komoditas pertanian dari petani/pemilik hasil tani ke koperasi, termasuk proses Quality Control (QC), penetapan harga, dan pembayaran.

**Fase saat ini**: Boilerplate / Fondasi awal.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: PostgreSQL
- **Autentikasi**: JWT
- **Dokumentasi API**: OpenAPI / Swagger

## Mulai Cepat

### Prasyarat

- Node.js LTS (v20+)
- PostgreSQL database
- npm

### Instalasi

```bash
# Clone repository
git clone https://github.com/bernarddenata/KaryaTani_Center.git
cd KaryaTani_Center

# Install dependensi
npm install

# Salin file environment
cp .env.example .env
# Edit .env dan isi kredensial yang benar
```

### Konfigurasi Environment

Edit file `.env` dan isi variabel berikut:

| Variabel | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | URL koneksi PostgreSQL |
| `JWT_SECRET` | Secret key untuk JWT |
| `NEXTAUTH_SECRET` | Secret key untuk auth |
| `APP_URL` | URL aplikasi |

**Jangan commit file `.env` ke repository.**

### Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migrasi
npx prisma migrate dev

# Jalankan seeder
npx prisma db seed
```

### Jalankan Aplikasi

```bash
# Mode development
npm run dev

# Build untuk production
npm run build

# Jalankan build
npm run start
```

Aplikasi berjalan di `http://localhost:3000`.

## Akun Demo

| Email | Peran | Password |
|-------|-------|----------|
| admin@karyatani.local | System Admin | password123 |
| manager@karyatani.local | Manager Koperasi | password123 |
| supervisor.qc@karyatani.local | Supervisor QC | password123 |
| qc@karyatani.local | Petugas QC | password123 |
| finance@karyatani.local | Staff Keuangan | password123 |
| koperasi@karyatani.local | Admin Koperasi | password123 |
| viewer@karyatani.local | Viewer | password123 |

**Password default ini hanya untuk development. Harus diganti sebelum digunakan di lingkungan produksi.**

## API Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/openapi.json`
- **Health Check**: `http://localhost:3000/api/health`

## Struktur Modul

| Modul | Deskripsi |
|-------|-----------|
| Dasbor | Ringkasan aktivitas koperasi |
| Petani / Pemilik | Data pemilik hasil tani |
| Pengantar | Data pengantar/perwakilan petani |
| Komoditas | Jenis komoditas dan varian |
| Daftar Harga | Harga komoditas per grade |
| Template QC | Template pemeriksaan kualitas |
| Penjualan | Transaksi penjualan hasil tani |
| Hasil QC | Hasil pemeriksaan kualitas |
| Riwayat QC | Riwayat QC per petani |
| Bayar Petani | Proses pembayaran ke petani |
| Saldo Petani | Saldo dompet petani |
| Riwayat Saldo | Mutasi saldo petani |
| Keberatan | Sengketa dan keberatan |
| Batch | Pengelompokan penjualan |
| Laporan | Laporan ringkasan |
| Audit Log | Catatan aktivitas |
| Pengguna | Manajemen pengguna |
| Hak Akses | Manajemen peran dan akses |

## Deployment Development (VPS)

Lihat panduan lengkap di [docs/DEPLOY_DEV_VPS.md](docs/DEPLOY_DEV_VPS.md).

```bash
# PM2
pm2 start npm --name karya-tani-center-dev -- run start
pm2 save
```

## Catatan

- Ini adalah boilerplate / fondasi awal.
- Workflow bisnis lengkap belum diimplementasi.
- Deployment produksi akan dikonfigurasi terpisah.
- Jangan commit file `.env` ke repository.
