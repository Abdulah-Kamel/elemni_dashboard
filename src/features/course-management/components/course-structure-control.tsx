"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

type CourseStructureControlProps = {
  value: boolean
  disabled?: boolean
  onChange: (useChapters: boolean) => void
}

type CourseStructureConfirmationProps = {
  open: boolean
  nextValue: boolean
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function CourseStructureControl({
  value,
  disabled,
  onChange,
}: CourseStructureControlProps) {
  const t = useTranslations("courses")

  return (
    <RadioGroup
      value={value ? "chapters" : "flat"}
      onValueChange={(v) => onChange(v === "chapters")}
      disabled={disabled}
      aria-label={t("structure_label")}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="flat" id="structure-flat" />
        <label htmlFor="structure-flat" className="text-sm">
          {t("flat_lessons")}
        </label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="chapters" id="structure-chapters" />
        <label htmlFor="structure-chapters" className="text-sm">
          {t("chapters_organized")}
        </label>
      </div>
    </RadioGroup>
  )
}

export function CourseStructureConfirmation({
  open,
  nextValue,
  pending,
  onConfirm,
  onCancel,
}: CourseStructureConfirmationProps) {
  const t = useTranslations("courses")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent aria-label={t("structure_change_title")}>
        <DialogHeader>
          <DialogTitle>{t("structure_change_title")}</DialogTitle>
          <DialogDescription>
            {nextValue
              ? t("structure_to_chapters_warning")
              : t("structure_to_flat_warning")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
            {t("confirm_structure_change")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
