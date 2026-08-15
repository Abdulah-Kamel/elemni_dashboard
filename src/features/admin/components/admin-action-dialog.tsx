"use client"

import { Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function AdminActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  pending = false,
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  pending?: boolean
  onConfirm: () => void | Promise<void>
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!pending) onOpenChange(nextOpen) }}>
      <DialogContent showCloseButton={!pending} className="overflow-hidden p-0 sm:max-w-[28rem]">
        <div className="relative px-6 pb-2 pt-7">
          <div className={cn(
            "mb-4 grid size-12 place-items-center rounded-2xl",
            variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}>
            <ShieldAlert className="size-6 animate-in zoom-in duration-300 motion-reduce:animate-none" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="leading-6">{description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="border-t border-border bg-surface-muted/35 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
