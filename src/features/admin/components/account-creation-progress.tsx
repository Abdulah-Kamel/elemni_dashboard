"use client"

import { useEffect, useState } from "react"
import { Check, CircleAlert, Loader2, Mail, ShieldCheck, UserRoundPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type CreationStatus = "pending" | "success" | "warning" | "error"

const steps = [
  { key: "creation_step_account", icon: UserRoundPlus },
  { key: "creation_step_access", icon: ShieldCheck },
  { key: "creation_step_email", icon: Mail },
] as const

export function AccountCreationProgress({
  open,
  role,
  status,
  onClose,
}: {
  open: boolean
  role: "teacher" | "student"
  status: CreationStatus
  onClose: () => void
}) {
  const t = useTranslations("admin")
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!open || status !== "pending") return
    const accessTimer = window.setTimeout(() => setActiveStep(1), 700)
    const emailTimer = window.setTimeout(() => setActiveStep(2), 1500)
    return () => {
      window.clearTimeout(accessTimer)
      window.clearTimeout(emailTimer)
    }
  }, [open, status])

  const terminal = status !== "pending"
  const successful = status === "success"
  const warning = status === "warning"
  const progress = terminal ? 100 : [24, 58, 84][activeStep]
  const title = terminal
    ? successful || warning ? t("creation_ready") : t("creation_failed")
    : t("creation_title", { role: t(`creation_role_${role}`) })
  const description = successful
    ? t("creation_email_sent")
    : warning
      ? t("creation_email_warning")
      : status === "error"
        ? t("creation_error")
        : t("creation_wait")
  const close = () => {
    setActiveStep(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && terminal) close() }}>
      <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-[28rem]">
        <div className="relative isolate overflow-hidden px-6 pb-5 pt-7 text-center">
          <div className="absolute inset-x-10 top-0 -z-10 h-32 rounded-full bg-primary/15 blur-3xl" />
          <div className={cn(
            "mx-auto mb-4 grid size-16 place-items-center rounded-2xl shadow-sm transition-all duration-500 motion-reduce:transition-none",
            terminal ? successful ? "bg-success-tint text-success" : warning ? "bg-warning-tint text-warning" : "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}>
            {terminal
              ? successful ? <Check className="size-8 animate-in zoom-in" /> : <CircleAlert className="size-8 animate-in zoom-in" />
              : <Loader2 className="size-8 animate-spin motion-reduce:animate-none" />}
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="w-full leading-6" aria-live="polite">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 border-y border-border bg-surface-container/40 px-6 py-5">
          <div
            role="progressbar"
            aria-label={t("creation_progress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
          <ol className="space-y-3">
            {steps.map(({ key, icon: Icon }, index) => {
              const complete = terminal || index < activeStep
              const active = !terminal && index === activeStep
              const failedEmail = warning && index === 2
              return (
                <li key={key} className={cn("flex items-center gap-3 transition-opacity duration-300", !complete && !active && "opacity-45")}>
                  <span className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl border transition-colors duration-300",
                    failedEmail ? "border-warning/30 bg-warning-tint text-warning" : complete ? "border-success/25 bg-success-tint text-success" : active ? "border-primary/25 bg-primary/10 text-primary" : "border-border bg-surface text-on-surface-muted",
                  )}>
                    {complete && !failedEmail ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Icon className="size-4" />}
                  </span>
                  <span className={cn("font-medium", active && "text-primary", failedEmail && "text-warning")}>{t(key)}</span>
                </li>
              )
            })}
          </ol>
        </div>

        {terminal && <DialogFooter className="p-6 pt-2"><Button className="w-full" onClick={close}>{t("creation_done")}</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
