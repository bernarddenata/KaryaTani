import Link from "next/link"
import {
  Sprout,
  HandCoins,
  ScanLine,
  Users,
  ClipboardCheck,
  Wallet,
  Boxes,
  Package,
  BarChart3,
  Download,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  LogIn,
} from "lucide-react"

export const metadata = {
  title: "Karya Tani Center — Ekonomi Kerakyatan Dimulai dari Desa",
  description:
    "Platform digital koperasi pertanian untuk Program Koperasi Desa/Kelurahan Merah Putih: penjualan hasil tani transparan, QC adil, pembayaran langsung ke petani.",
}

const FITUR = [
  {
    icon: ClipboardCheck,
    title: "QC Transparan & Adil",
    desc: "Hasil panen dinilai dengan template mutu terstandar. Petani melihat sendiri grade, berat, dan alasannya — tidak ada yang ditutupi.",
  },
  {
    icon: Wallet,
    title: "Uang Langsung ke Petani",
    desc: "Setiap kilogram dihargai sesuai daftar harga koperasi. Saldo tercatat, pembayaran hanya ke anggota koperasi terdaftar.",
  },
  {
    icon: Package,
    title: "Keterlacakan Batch",
    desc: "Setiap setoran punya nomor batch. Dari sawah, gudang, QC, sampai pengiriman — semuanya bisa ditelusuri.",
  },
  {
    icon: Boxes,
    title: "Persediaan Gudang",
    desc: "Stok transit, stok baik per grade, stok rusak, pengiriman, hingga pemusnahan tercatat rapi per koperasi.",
  },
  {
    icon: Users,
    title: "Multi-Koperasi",
    desc: "Satu platform untuk banyak koperasi desa. Data tiap koperasi terpisah aman, pengurus hanya melihat koperasinya sendiri.",
  },
  {
    icon: BarChart3,
    title: "Laporan Siap Rapat",
    desc: "Laporan penjualan, QC, saldo, dan stok siap diunduh CSV — untuk RAT, pembina, maupun dinas.",
  },
]

const APPS = [
  {
    icon: Smartphone,
    name: "Karya Taniku",
    audience: "Untuk Petani",
    desc: "Pantau setoran, hasil QC, estimasi pembayaran, dan kartu anggota digital dengan QR.",
    href: "/api/apps/karya-taniku/download",
    label: "Unduh APK",
  },
  {
    icon: ScanLine,
    name: "Karya Tani QC",
    audience: "Untuk Petugas Koperasi",
    desc: "Terima setoran, pindai QR petani, proses QC dan grading, hitung estimasi pembayaran di lapangan.",
    href: "/api/apps/karya-tani-qc/download",
    label: "Unduh APK",
  },
  {
    icon: Sprout,
    name: "Dasbor Koperasi",
    audience: "Untuk Pengurus",
    desc: "Kelola anggota, harga, QC, saldo, persediaan, dan laporan koperasi dari peramban web.",
    href: "/auth/login",
    label: "Masuk Dasbor",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Karya Tani Center"
              className="size-9 rounded-full bg-white object-contain p-0.5"
            />
            <span className="text-sm font-bold text-white">
              Karya Tani Center
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 sm:flex">
            <a href="#fitur" className="hover:text-white">Fitur</a>
            <a href="#aplikasi" className="hover:text-white">Aplikasi</a>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 font-bold text-brand-dark transition-colors hover:bg-brand-light"
            >
              <LogIn className="size-4" /> Masuk
            </Link>
          </nav>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-bold text-brand-dark sm:hidden"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D25] via-[#1F6B3A] to-[#2E7A47]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,185,66,0.4)_0%,_transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.09em] text-warning">
            <Sprout className="size-3.5" />
            Gerakan Ekonomi Kerakyatan
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Ekonomi Kerakyatan{" "}
            <span className="text-warning">Dimulai dari Desa</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Karya Tani Center menghubungkan petani dan koperasi dalam satu
            platform digital: hasil panen ditimbang jujur, mutu dinilai
            terbuka, dan uangnya kembali ke tangan petani — bukan tengkulak.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-xl bg-warning px-6 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" />
              Unduh Aplikasi Mobile
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-brand-dark"
            >
              Masuk Dasbor Koperasi
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">100%</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">Transparan untuk petani</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">3</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">Aplikasi terpadu</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">1</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">Batch terlacak ujung ke ujung</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Program Merah Putih ===== */}
      <section className="relative border-y border-border bg-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#CE1126] via-[#CE1126] to-white" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#CE1126]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.09em] text-[#CE1126]">
              <ShieldCheck className="size-3.5" />
              Koperasi Desa/Kelurahan Merah Putih
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Sejalan dengan Program Prioritas{" "}
              <span className="text-primary">Presiden Prabowo Subianto</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Koperasi Desa/Kelurahan Merah Putih adalah program pemerintah
              untuk membangun kekuatan ekonomi rakyat dari tingkat desa —
              memutus rantai tengkulak, memperkuat posisi tawar petani, dan
              memastikan hasil bumi Indonesia dinikmati oleh rakyatnya
              sendiri. Karya Tani Center hadir sebagai tulang punggung digital
              koperasi: jujur dalam timbangan, terbuka dalam mutu, dan tertib
              dalam pembukuan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-brand-light px-3 py-1.5 text-primary">Kedaulatan Pangan</span>
              <span className="rounded-full bg-brand-light px-3 py-1.5 text-primary">Pemberdayaan Petani</span>
              <span className="rounded-full bg-brand-light px-3 py-1.5 text-primary">Koperasi Modern</span>
            </div>
          </div>
          <figure className="rounded-2xl border border-border bg-background p-8">
            <blockquote className="text-lg font-semibold leading-relaxed text-brand-dark sm:text-xl">
              “Perekonomian disusun sebagai usaha bersama berdasar atas asas
              kekeluargaan.”
            </blockquote>
            <figcaption className="mt-4 text-sm text-muted-foreground">
              — Pasal 33 Ayat (1) UUD 1945, landasan ekonomi kerakyatan dan
              gerakan koperasi Indonesia
            </figcaption>
            <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
              Koperasi bukan sekadar badan usaha — ia adalah alat perjuangan
              ekonomi rakyat. Teknologi hanya mempercepatnya.
            </div>
          </figure>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dari Timbangan sampai Pembayaran,{" "}
            <span className="text-primary">Semua Tercatat</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Dibangun untuk pengurus koperasi dan petani yang tidak mau lagi
            dirugikan oleh pencatatan manual.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FITUR.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Aplikasi ===== */}
      <section id="aplikasi" className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Satu Ekosistem, <span className="text-primary">Tiga Aplikasi</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Petani, petugas QC, dan pengurus koperasi bekerja dengan data
              yang sama — langsung dari ponsel atau komputer.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {APPS.map((app) => (
              <div
                key={app.name}
                className="flex flex-col rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white">
                  <app.icon className="size-5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.09em] text-muted-foreground">
                  {app.audience}
                </p>
                <h3 className="mt-1 text-lg font-bold">{app.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {app.desc}
                </p>
                <a
                  href={app.href}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
                >
                  {app.label === "Unduh APK" ? (
                    <Download className="size-4" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                  {app.label}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Atau buka halaman unduhan lengkap di{" "}
            <Link href="/download" className="font-semibold text-primary underline">
              karyatani.com/download
            </Link>
          </p>
        </div>
      </section>

      {/* ===== CTA Akhir ===== */}
      <section className="relative overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D25] via-[#1F6B3A] to-[#2E7A47]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <HandCoins className="mx-auto size-10 text-warning" />
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
            Saatnya Hasil Panen Kembali ke Petani
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            Gabungkan koperasi desamu ke Karya Tani Center dan mulai catat
            setoran pertama hari ini.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-xl bg-warning px-6 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" />
              Unduh Aplikasi
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-brand-dark"
            >
              Masuk Dasbor
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0B2E1C] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Karya Tani Center"
            className="size-10 rounded-full bg-white object-contain p-0.5"
          />
          <p className="text-sm font-bold text-white">Karya Tani Center</p>
          <p className="text-xs text-white/60">
            Mendukung Program Koperasi Desa/Kelurahan Merah Putih ·
            Ekonomi Kerakyatan untuk Kedaulatan Pangan Indonesia
          </p>
        </div>
      </footer>
    </div>
  )
}
