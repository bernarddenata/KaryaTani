# Deployment Development - VPS

Panduan deployment Karya Tani Center ke server development VPS.

## Informasi Server

- **SSH**: `ssh root@187.77.115.114`
- **Target Path**: `/var/www/karya-tani-center`
- **PM2 App Name**: `karya-tani-center-dev`
- **Port**: `3000`

## Langkah-langkah Deployment

### 1. Masuk ke Server

```bash
ssh root@187.77.115.114
```

### 2. Install Dependensi (jika belum ada)

```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Git (biasanya sudah ada)
apt-get install -y git
```

### 3. Clone Repository

```bash
git clone https://github.com/bernarddenata/KaryaTani_Center.git /var/www/karya-tani-center
cd /var/www/karya-tani-center
```

### 4. Buat File .env

```bash
cp .env.example .env
nano .env
```

Isi kredensial database yang benar pada file .env. **Jangan commit file .env ke repository.**

### 5. Install & Build

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build
```

### 6. Jalankan dengan PM2

```bash
pm2 start npm --name karya-tani-center-dev -- run start
pm2 save
```

### 7. Verifikasi

```bash
# Cek status PM2
pm2 status

# Cek health endpoint
curl http://localhost:3000/api/health

# Cek log
pm2 logs karya-tani-center-dev
```

### 8. Akses Aplikasi

- **Aplikasi**: `http://187.77.115.114:3000`
- **API Docs**: `http://187.77.115.114:3000/api/docs`
- **Health Check**: `http://187.77.115.114:3000/api/health`

## Perintah Berguna

```bash
# Restart aplikasi
pm2 restart karya-tani-center-dev

# Stop aplikasi
pm2 stop karya-tani-center-dev

# Lihat log real-time
pm2 logs karya-tani-center-dev --lines 50

# Update dari repository
cd /var/www/karya-tani-center
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart karya-tani-center-dev
```

## Catatan Penting

- File `.env` berisi kredensial sensitif. **Jangan commit ke repository.**
- Password default untuk akun demo adalah `password123`. **Harus diganti sebelum produksi.**
- Deployment ini hanya untuk lingkungan development. Deployment produksi akan dikonfigurasi terpisah.
