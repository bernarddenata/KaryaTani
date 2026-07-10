"use client"

import { DashboardShell } from "@/components/shared/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import {
  ShoppingCart,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Banknote,
} from "lucide-react"

const stats = [
  {
    label: "Penjualan Hari Ini",
    value: "12",
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Menunggu QC",
    value: "5",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "QC Selesai",
    value: "8",
    icon: CheckCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Keberatan Aktif",
    value: "2",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "Menunggu Pembayaran",
    value: "3",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Total Estimasi Hari Ini",
    value: "Rp 45.200.000",
    icon: Banknote,
    color: "text-green-600",
    bg: "bg-green-50",
  },
]

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dasbor"
      description="Ringkasan aktivitas koperasi hari ini"
      permission="dashboard.view"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-amber-100 bg-amber-50/50">
        <CardContent className="py-4">
          <p className="text-sm text-amber-800">
            Data ini masih contoh untuk fondasi awal. Perhitungan asli akan dibuat pada fase berikutnya.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
