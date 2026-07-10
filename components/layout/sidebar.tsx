"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Wheat,
  Tag,
  ClipboardCheck,
  ShoppingCart,
  CheckSquare,
  History,
  Banknote,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  Package,
  BarChart3,
  FileText,
  UserCog,
  Shield,
  Key,
  Settings,
  Sprout,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export interface SidebarUser {
  name: string
  email: string
  permissions: string[]
}

interface NavItem {
  label: string
  href: string
  permission: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Utama",
    items: [
      {
        label: "Dasbor",
        href: "/dashboard",
        permission: "dashboard.view",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        label: "Petani / Pemilik",
        href: "/petani",
        permission: "farmers.view",
        icon: Users,
      },
      {
        label: "Pengantar",
        href: "/pengantar",
        permission: "farmer_representatives.view",
        icon: UserCheck,
      },
      {
        label: "Komoditas",
        href: "/komoditas",
        permission: "commodities.view",
        icon: Wheat,
      },
      {
        label: "Daftar Harga",
        href: "/daftar-harga",
        permission: "price_lists.view",
        icon: Tag,
      },
      {
        label: "Template QC",
        href: "/template-qc",
        permission: "qc_templates.view",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        label: "Penjualan",
        href: "/penjualan",
        permission: "farmer_sales.view",
        icon: ShoppingCart,
      },
      {
        label: "Hasil QC",
        href: "/hasil-qc",
        permission: "qc_results.view",
        icon: CheckSquare,
      },
      {
        label: "Riwayat QC",
        href: "/riwayat-qc",
        permission: "qc_history.view",
        icon: History,
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        label: "Bayar Petani",
        href: "/bayar-petani",
        permission: "farmer_payouts.view",
        icon: Banknote,
      },
      {
        label: "Saldo Petani",
        href: "/saldo-petani",
        permission: "farmer_wallets.view",
        icon: Wallet,
      },
      {
        label: "Riwayat Saldo",
        href: "/riwayat-saldo",
        permission: "farmer_wallet_mutations.view",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Lainnya",
    items: [
      {
        label: "Keberatan",
        href: "/keberatan",
        permission: "disputes.view",
        icon: AlertTriangle,
      },
      {
        label: "Batch",
        href: "/batch",
        permission: "batch.view",
        icon: Package,
      },
      {
        label: "Laporan",
        href: "/laporan",
        permission: "reports.view",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Administrasi",
    items: [
      {
        label: "Audit Log",
        href: "/audit-log",
        permission: "audit_logs.view",
        icon: FileText,
      },
      {
        label: "Pengguna",
        href: "/pengguna",
        permission: "users.view",
        icon: UserCog,
      },
      {
        label: "Hak Akses",
        href: "/hak-akses",
        permission: "roles.view",
        icon: Shield,
      },
      {
        label: "Akses API",
        href: "/akses-api",
        permission: "api_access.view",
        icon: Key,
      },
      {
        label: "Pengaturan",
        href: "/pengaturan",
        permission: "settings.view",
        icon: Settings,
      },
    ],
  },
]

function SidebarContent({ user }: { user: SidebarUser }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500 text-white">
          <Sprout className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            Karya Tani Center
          </span>
          <span className="text-xs text-cyan-300/70">Koperasi Pertanian</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            user.permissions.includes(item.permission)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-4">
              <span className="mb-1.5 block px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-cyan-400/50">
                {group.label}
              </span>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href))
                  const Icon = item.icon

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white/10 text-amber-400"
                            : "text-cyan-200/80 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive ? "text-amber-400" : "text-cyan-400/50"
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <Separator className="bg-white/10" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-cyan-800 text-xs font-semibold text-cyan-100">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-cyan-100">
              {user.name}
            </span>
            <span className="truncate text-xs text-cyan-400/50">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/10 lg:bg-[#0d2d3d]">
      <SidebarContent user={user} />
    </aside>
  )
}

export function MobileSidebar({ user }: { user: SidebarUser }) {
  return (
    <div className="flex h-full flex-col bg-[#0d2d3d]">
      <SidebarContent user={user} />
    </div>
  )
}
