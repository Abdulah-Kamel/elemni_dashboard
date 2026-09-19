"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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

  if (isArchived) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onUnarchive}
      >
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
        onClick={() => setConfirmOpen(true)}
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
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                onArchive()
              }}
            >
              {t("confirm_archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
