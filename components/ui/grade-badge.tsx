import { cn } from "@/lib/utils"

/**
 * Grade badge per design-tokens.md §5: full-saturation grade color,
 * white text, pill radius, weight 700.
 */

const GRADE_CLASSES: Record<string, string> = {
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
  REJECT: "bg-grade-reject",
}

export interface GradeBadgeProps {
  grade: string
  label?: string
  dense?: boolean
  className?: string
}

export function GradeBadge({ grade, label, dense, className }: GradeBadgeProps) {
  const key = grade.toUpperCase()
  const bg = GRADE_CLASSES[key] ?? "bg-muted-foreground"
  const text = label ?? (key === "REJECT" ? "Reject" : `Grade ${key}`)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold text-white whitespace-nowrap",
        dense ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        bg,
        className
      )}
    >
      {text}
    </span>
  )
}
