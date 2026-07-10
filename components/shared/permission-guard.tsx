"use client"

import type { ReactNode } from "react"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/components/layout/auth-provider"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

function DefaultFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
          <ShieldAlert className="size-8" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-lg font-semibold text-gray-900">
            Akses Ditolak
          </h2>
          <p className="max-w-sm text-sm text-gray-500">
            Anda tidak memiliki akses ke halaman ini. Hubungi administrator
            untuk mendapatkan hak akses yang diperlukan.
          </p>
        </div>
      </div>
    </div>
  )
}

export function PermissionGuard({
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : <DefaultFallback />
  }

  return <>{children}</>
}
