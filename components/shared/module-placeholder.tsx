"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: ReactNode
}

export function ModulePlaceholder({
  title,
  description,
  icon,
}: ModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Ikon besar */}
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/15 text-primary [&_svg]:size-10">
          {icon}
        </div>

        {/* Judul dan deskripsi */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="max-w-md text-sm text-gray-500">{description}</p>
        </div>

        {/* Kartu status */}
        <div className="w-full max-w-sm rounded-xl border border-primary/20 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-primary">
            Fondasi modul sudah siap dikembangkan.
          </p>
        </div>

        {/* Badge info */}
        <Badge variant="secondary" className="gap-1.5 bg-warning/20 text-[#8A6414]">
          <Info className="size-3" />
          Data ini masih contoh untuk fondasi awal.
        </Badge>
      </div>
    </div>
  )
}
