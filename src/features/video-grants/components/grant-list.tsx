"use client"

import { useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { revokeGrant } from "../actions"
import type { CourseVideo, Grant } from "../schema"

type Props = {
  studentId: number
  grants: Grant[]
  videos: CourseVideo[]
  now: number
  onRefresh: () => void
}

export function GrantList({
  studentId,
  grants,
  videos,
  now,
  onRefresh,
}: Props) {
  const t = useTranslations("videoGrants")
  const locale = useLocale()
  const [selected, setSelected] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  async function revoke() {
    if (selected === null || submitting.current) return
    submitting.current = true
    setPending(true)
    setError(null)
    try {
      const result = await revokeGrant(selected, studentId)
      if (!result.success) {
        setError(t(`errors.${result.code}`))
        return
      }
      setSelected(null)
      onRefresh()
    } catch {
      setError(t("errors.unknown"))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  if (!grants.length)
    return <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
  return (
    <>
      <ul className="mt-3 space-y-2">
        {grants.map((grant) => {
          const status = grant.revoked_at
            ? "revoked"
            : grant.expires_at && Date.parse(grant.expires_at) <= now
              ? "expired"
              : grant.remaining_views === 0
                ? "usedUp"
                : "active"
          return (
            <li
              key={grant.id}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-medium">
                  {videos.find((v) => v.item_id === grant.item_id)?.title ??
                    t("videoFallback", { id: grant.item_id })}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${status === "active" ? "bg-success-tint text-success" : "bg-surface-muted text-muted-foreground"}`}
                >
                  {t(`status.${status}`)}
                </span>
              </div>
              <p className="text-sm tabular-nums">
                {t("remaining", {
                  remaining: grant.remaining_views,
                  granted: grant.granted_views,
                })}
              </p>
              {grant.reason && (
                <p className="text-xs break-words text-muted-foreground">
                  {grant.reason}
                </p>
              )}
              {grant.expires_at && (
                <time
                  dateTime={grant.expires_at}
                  className="block text-xs text-muted-foreground"
                >
                  {formatter.format(new Date(grant.expires_at))}
                </time>
              )}
              {status === "active" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setSelected(grant.id)
                  }}
                >
                  {t("revoke")}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <Dialog
        open={selected !== null}
        onOpenChange={(value) => {
          if (!value && !submitting.current) setSelected(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <DialogTitle>{t("revoke")}</DialogTitle>
          <DialogDescription>{t("revokeConfirm")}</DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setSelected(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void revoke()}
            >
              {t("revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
