"use client"

import { BookPlus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function EmptyState() {
  const t = useTranslations("courses")

  return (
    <Card className="border-dashed bg-surface">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="rounded-2xl bg-primary-tint p-4 text-primary">
          <BookPlus className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-title-lg font-semibold text-on-surface">
            {t("empty")}
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            {t("empty_hint")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            document.getElementById("create-course-trigger")?.click()
          }
        >
          <Plus data-icon="inline-start" />
          {t("empty_action")}
        </Button>
      </CardContent>
    </Card>
  )
}
