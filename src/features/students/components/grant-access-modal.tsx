"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { StudentSubscriptionRow } from "@/features/students/components/student-table"

interface GrantAccessModalProps {
  student: StudentSubscriptionRow | null
  onClose: () => void
  onConfirm: (accessType: string) => void
}

const ACCESS_TYPES = [
  { value: "lifetime", key: "access_lifetime" },
  { value: "3month", key: "access_3month" },
  { value: "6month", key: "access_6month" },
  { value: "view_only", key: "access_view_only" },
] as const

export function GrantAccessModal({
  student,
  onClose,
  onConfirm,
}: GrantAccessModalProps) {
  const t = useTranslations("student")
  const [accessType, setAccessType] = useState("lifetime")

  if (!student) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">
          {t("grant_access_title")}
        </h2>
        <p className="mt-1 text-sm text-on-surface-muted">
          {t("grant_access_description", { name: student.name })}
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {student.course}
        </p>
        <div className="mt-4">
          <label className="text-xs font-semibold text-on-surface-muted">
            {t("access_type")}
          </label>
          <select
            value={accessType}
            onChange={(e) => setAccessType(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {ACCESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.key)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={() => onConfirm(accessType)}>{t("confirm")}</Button>
        </div>
      </div>
    </div>
  )
}
