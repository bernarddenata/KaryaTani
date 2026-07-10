"use client"

import { DashboardShell } from "@/components/shared/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare } from "lucide-react"

export default function HasilQCPage() {
  return (
    <DashboardShell title="Hasil QC" description="Lihat dan kelola hasil pemeriksaan kualitas komoditas yang masuk." permission="qc_results.view">
      <Card className="border-green-100">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare className="h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fondasi Modul Hasil QC</h2>
          <p className="text-gray-500 mb-4 max-w-md">Lihat dan kelola hasil pemeriksaan kualitas komoditas yang masuk.</p>
          <Badge variant="secondary" className="bg-green-50 text-green-700">Fondasi modul sudah siap dikembangkan</Badge>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
