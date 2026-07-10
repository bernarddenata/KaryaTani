"use client"

import { useAuth } from "@/components/layout/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function DashboardShell({
  children,
  title,
  description,
  permission,
}: {
  children: React.ReactNode
  title: string
  description?: string
  permission: string
}) {
  const { user, loading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login")
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#065366]"></div>
      </div>
    )
  }

  if (!user) return null

  if (!hasPermission(permission)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}
