"use client"

import { DashboardShell } from "@/components/shared/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key } from "lucide-react"

export default function AksesAPIPage() {
  return (
    <DashboardShell title="Akses API" description="Kelola akses API dan dokumentasi integrasi sistem." permission="api_access.view">
      <Card className="border-green-100">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Key className="h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fondasi Modul Akses API</h2>
          <p className="text-gray-500 mb-4 max-w-md">Kelola akses API dan dokumentasi integrasi sistem.</p>
          <Badge variant="secondary" className="bg-green-50 text-green-700">Fondasi modul sudah siap dikembangkan</Badge>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
