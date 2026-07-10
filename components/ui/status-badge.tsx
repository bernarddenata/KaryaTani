import { cn } from "@/lib/utils"

/**
 * Status badge per design-tokens.md §5: pill radius, tinted background,
 * saturated foreground, weight 700. Accepts both English mobile codes
 * (WAITING_QC) and internal Bahasa codes (MENUNGGU_QC).
 */

type StatusTone = "success" | "warning" | "orange" | "danger" | "info" | "muted"

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-primary/15 text-primary",
  warning: "bg-warning/20 text-[#8A6414]",
  orange: "bg-orange/15 text-[#A05E12]",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
  muted: "bg-muted text-muted-foreground",
}

const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  WAITING_QC: { tone: "warning", label: "Menunggu QC" },
  MENUNGGU_QC: { tone: "warning", label: "Menunggu QC" },
  QC_IN_PROGRESS: { tone: "info", label: "QC Diproses" },
  QC_DIPROSES: { tone: "info", label: "QC Diproses" },
  QC_COMPLETED: { tone: "success", label: "QC Selesai" },
  QC_SELESAI: { tone: "success", label: "QC Selesai" },
  PAYMENT_PENDING: { tone: "orange", label: "Menunggu Pembayaran" },
  MENUNGGU_PEMBAYARAN: { tone: "orange", label: "Menunggu Pembayaran" },
  PAID: { tone: "success", label: "Dibayar" },
  DIBAYAR: { tone: "success", label: "Dibayar" },
  DISPUTED: { tone: "danger", label: "Sengketa" },
  KEBERATAN: { tone: "danger", label: "Sengketa" },
  CANCELLED: { tone: "muted", label: "Dibatalkan" },
  DIBATALKAN: { tone: "muted", label: "Dibatalkan" },
}

export interface StatusBadgeProps {
  status: string
  label?: string
  dense?: boolean
  className?: string
}

export function StatusBadge({ status, label, dense, className }: StatusBadgeProps) {
  const entry = STATUS_MAP[status]
  const tone = entry?.tone ?? "muted"
  const text = label ?? entry?.label ?? status

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold whitespace-nowrap",
        dense ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        TONE_CLASSES[tone],
        className
      )}
    >
      {text}
    </span>
  )
}
