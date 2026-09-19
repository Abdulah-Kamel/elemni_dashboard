"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type ArchiveCourseControlProps = {
  isArchived: boolean
  pending: boolean
  onArchive: () => void
  onUnarchive: () => void
}

export function ArchiveCourseControl({
  isArchived,
  pending,
  onArchive,
  onUnarchive,
}: ArchiveCourseControlProps) {
  const t = useTranslations("courses")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPending, setConfirmPending] = useState(false)

  if (isArchived) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onUnarchive}
      >
        {pending && <Loader2 className="me-1 size-3 animate-spin" aria-hidden="true" />}
        {t("unarchive_course")}
      </Button>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => { setConfirmPending(false); setConfirmOpen(true) }}
      >
        {t("archive_course")}
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("archive_title")}</DialogTitle>
            <DialogDescription>{t("archive_warning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={confirmPending}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmPending}
              onClick={() => {
                setConfirmPending(true)
                setConfirmOpen(false)
                onArchive()
              }}
            >
              {confirmPending && <Loader2 className="me-1 size-3 animate-spin" aria-hidden="true" />}
              {t("confirm_archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
