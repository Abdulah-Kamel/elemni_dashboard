"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { OUTLINE_BUTTON, PRIMARY_INK_BUTTON } from "./styles"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
  busy,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  destructive?: boolean
  busy?: boolean
  children?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-5 rounded-3xl p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description ? <DialogDescription className="leading-7">{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(PRIMARY_INK_BUTTON, destructive && "bg-destructive hover:bg-destructive/90")}
          >
            {confirmLabel}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={OUTLINE_BUTTON}>
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
