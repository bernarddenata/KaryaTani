"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

export interface AuthUser {
  id: string
  name: string
  email: string
  status: string
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) {
        setUser(null)
        return
      }
      const json = await res.json()
      if (json.success && json.data) {
        setUser(json.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // Lanjutkan redirect meskipun request gagal
    }
    setUser(null)
    router.push("/auth/login")
  }, [router])

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false
      return user.permissions.includes(permission)
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        hasPermission,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider")
  }
  return context
}
