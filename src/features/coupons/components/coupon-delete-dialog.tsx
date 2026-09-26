"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCouponMutations } from "../hooks/use-coupons"
import { errorText } from "./coupon-form-dialog"

type Props = {
  code: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
  /** Offered when the API refuses because the coupon has been redeemed. */
  onDeactivate?: () => void
}

export function CouponDeleteDialog({ code, open, onOpenChange, onDeleted, onDeactivate }: Props) {
  const t = useTranslations("adminCoupons")
  const [failure, setFailure] = useState<{ text: string; inUse: boolean } | null>(null)
  const { remove } = useCouponMutations()

  function change(next: boolean) {
    if (remove.isPending) return
    if (!next) setFailure(null)
    onOpenChange(next)
  }

  async function confirm() {
    if (!code) return
    setFailure(null)
    const result = await remove.mutateAsync(code)
    if (!result.ok) {
      setFailure({ text: errorText(t, result.error, result.message), inUse: result.error === "in_use" })
      return
    }
    toast.success(t("toast.deleted", { code }))
    onDeleted?.()
    change(false)
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>{t("delete.warning")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {t("delete.confirm")}{" "}
            <Badge variant="outline" className="font-mono font-bold" dir="ltr">
              {code}
            </Badge>
          </p>
          {failure && (
            <div role="alert" className="flex flex-col gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{failure.text}</p>
              {failure.inUse && onDeactivate && (
                <Button variant="outline" size="sm" className="self-start" onClick={() => { change(false); onDeactivate() }}>
                  {t("delete.deactivate_instead")}
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)} disabled={remove.isPending}>
            {t("form.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {t("delete.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
