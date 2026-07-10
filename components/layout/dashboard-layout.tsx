"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthProvider, useAuth } from "@/components/layout/auth-provider"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Tampilkan loading saat memeriksa autentikasi
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  // Redirect ke login jika belum terautentikasi
  if (!user) {
    router.push("/auth/login")
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Mengalihkan ke halaman masuk...</p>
        </div>
      </div>
    )
  }

  const sidebarUser = {
    name: user.name,
    email: user.email,
    permissions: user.permissions,
  }

  const headerUser = {
    name: user.name,
    email: user.email,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar user={sidebarUser} />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet
        open={mobileOpen}
        onOpenChange={(open) => setMobileOpen(open)}
      >
        <SheetContent side="left" showCloseButton={true}>
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <SheetDescription className="sr-only">
            Menu navigasi utama aplikasi
          </SheetDescription>
          <MobileSidebar user={sidebarUser} />
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={headerUser}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
