"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/layout/auth-provider"

interface HeaderProps {
  user: { name: string; email: string }
  onMobileMenuToggle: () => void
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Tutup menu saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4">
      {/* Kiri: tombol menu mobile */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="size-5 text-muted-foreground" />
          <span className="sr-only">Buka menu</span>
        </Button>
      </div>

      {/* Kanan: profil pengguna */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-foreground sm:inline-block">
            {user.name}
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
