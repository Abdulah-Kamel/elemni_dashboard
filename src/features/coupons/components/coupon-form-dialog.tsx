"use client"

import { useId, useState, type ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Dices, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/features/admin/format"
import { Segmented } from "@/features/admin/components/list-controls"
import { useTeachersQuery } from "@/features/admin/hooks/use-teachers-queries"
import { useDebouncedSearch } from "@/features/admin/hooks/use-url-filters"
import { examplePreview, generateCouponCode } from "../format"
import { EMPTY_COUPON_FORM, formFromCoupon, validateCouponForm, type CouponFormErrors, type CouponFormField, type CouponFormState } from "../form"
import type { Coupon, CouponErrorCode } from "../schema"
import { useCouponMutations } from "../hooks/use-coupons"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; the dialog creates a coupon otherwise. */
  coupon?: Coupon | null
  onSaved?: (coupon: Coupon) => void
}

/** Mount with a `key` per coupon so the form resets when the target changes. */
export function CouponFormDialog({ open, onOpenChange, coupon, onSaved }: Props) {
  const t = useTranslations("adminCoupons")
  const locale = useLocale()
  const editing = !!coupon
  const [form, setForm] = useState<CouponFormState>(() => (coupon ? formFromCoupon(coupon) : EMPTY_COUPON_FORM))
  const [errors, setErrors] = useState<CouponFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const { create, update } = useCouponMutations()
  const pending = create.isPending || update.isPending
  const baseId = useId()

  const set = <K extends CouponFormField>(key: K, value: CouponFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  function close(next: boolean) {
    if (pending) return
    onOpenChange(next)
    if (!next && !editing) {
      setForm(EMPTY_COUPON_FORM)
      setErrors({})
      setFormError(null)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    const checked = validateCouponForm(editing ? { ...form, code: coupon.code } : form)
    if (!checked.ok) {
      setErrors(checked.errors)
      setFormError(t("validation.form"))
      return
    }
    const result = editing
      ? await update.mutateAsync({ code: coupon.code, input: checked.input })
      : await create.mutateAsync(checked.input)
    if (!result.ok) {
      if (result.error === "duplicate_code") setErrors({ code: "duplicate_code" })
      setFormError(errorText(t, result.error, result.message))
      return
    }
    toast.success(editing ? t("toast.updated") : t("toast.created", { code: result.data.code }))
    onSaved?.(result.data)
    close(false)
  }

  const preview = examplePreview(form.type, form.value.trim(), form.min_price.trim() || null)
  const field = (name: CouponFormField) => ({
    id: `${baseId}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${baseId}-${name}-error` : undefined,
  })
  const error = (name: CouponFormField) =>
    errors[name] ? (
      <p id={`${baseId}-${name}-error`} className="text-xs text-destructive">
        {t(`validation.${errors[name]}`)}
      </p>
    ) : null

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>{editing ? t("form.edit_title", { code: coupon.code }) : t("form.create_title")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <form id={`${baseId}-form`} onSubmit={submit} noValidate className="flex flex-col gap-5">
          <Section title={t("form.section_discount")}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-code`}>{t("form.code")}</Label>
              <div className="flex gap-2">
                <Input
                  {...field("code")}
                  value={form.code}
                  onChange={(event) => set("code", event.target.value.toUpperCase())}
                  disabled={editing}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={20}
                  className="font-mono tracking-wide uppercase"
                  placeholder="SAVE20"
                />
                {!editing && (
                  <Button type="button" variant="outline" onClick={() => set("code", generateCouponCode())}>
                    <Dices className="size-4" aria-hidden="true" />
                    {t("form.generate")}
                  </Button>
                )}
              </div>
              <p className="text-xs text-on-surface-muted">{editing ? t("form.code_locked") : t("form.code_hint")}</p>
              {error("code")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t("form.type")}</span>
                <Segmented<Coupon["type"]>
                  label={t("form.type")}
                  value={form.type}
                  onChange={(type) => set("type", type)}
                  options={[
                    { value: "percentage", label: t("form.percentage") },
                    { value: "fixed", label: t("form.fixed") },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-value`}>{t("form.value")}</Label>
                <div className="relative">
                  <Input
                    {...field("value")}
                    value={form.value}
                    onChange={(event) => set("value", event.target.value)}
                    inputMode="decimal"
                    dir="ltr"
                    className="pe-12 text-end tabular-nums"
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-muted">
                    {form.type === "percentage" ? "%" : t("form.currency")}
                  </span>
                </div>
                <p className="text-xs text-on-surface-muted">
                  {form.type === "percentage" ? t("form.value_hint_percentage") : t("form.value_hint_fixed")}
                </p>
                {error("value")}
              </div>
            </div>

            <ExampleLine preview={preview} locale={locale} />
          </Section>

          <Section title={t("form.section_validity")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-starts`}>{t("form.starts")}</Label>
                <Input {...field("starts")} type="date" value={form.starts} onChange={(event) => set("starts", event.target.value)} />
                {error("starts")}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-expires`}>{t("form.expires")}</Label>
                <Input {...field("expires")} type="date" value={form.expires} onChange={(event) => set("expires", event.target.value)} />
                {error("expires")}
              </div>
            </div>
            <p className="-mt-2 text-xs text-on-surface-muted">{t("form.dates_hint")}</p>
          </Section>

          <Section title={t("form.section_limits")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label={t("form.max_uses")} hint={t("form.empty_unlimited")} {...field("max_uses")} value={form.max_uses} onChange={(value) => set("max_uses", value)} error={error("max_uses")} />
              <NumberField label={t("form.per_student")} hint={t("form.empty_unlimited")} {...field("max_uses_per_student")} value={form.max_uses_per_student} onChange={(value) => set("max_uses_per_student", value)} error={error("max_uses_per_student")} />
              <NumberField label={t("form.min_price")} hint={t("form.min_price_hint")} decimal {...field("min_price")} value={form.min_price} onChange={(value) => set("min_price", value)} error={error("min_price")} />
            </div>
          </Section>

          <Section title={t("form.scope")}>
            <Segmented<Coupon["applies_to"]>
              label={t("form.scope")}
              value={form.applies_to}
              onChange={(scope) => set("applies_to", scope)}
              options={[
                { value: "all", label: t("form.scope_all") },
                { value: "courses", label: t("form.scope_courses") },
                { value: "teachers", label: t("form.scope_teachers") },
              ]}
            />
            {form.applies_to === "courses" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-course_ids`}>{t("form.course_ids")}</Label>
                <Input
                  {...field("course_ids")}
                  value={form.course_ids}
                  onChange={(event) => set("course_ids", event.target.value)}
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="12, 48"
                />
                <p className="text-xs text-on-surface-muted">{t("form.course_ids_note")}</p>
                {error("course_ids")}
              </div>
            )}
            {form.applies_to === "teachers" && (
              <TeacherPicker selected={form.teacher_ids} onChange={(ids) => set("teacher_ids", ids)} error={error("teacher_ids")} />
            )}
          </Section>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${baseId}-description`}>{t("form.note")}</Label>
            <Textarea {...field("description")} value={form.description} onChange={(event) => set("description", event.target.value)} rows={2} maxLength={200} placeholder={t("form.note_placeholder")} />
            {error("description")}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(event) => set("is_active", event.target.checked)} className="size-4 accent-primary" />
            {t("form.active")}
          </label>

          {formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)} disabled={pending}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" form={`${baseId}-form`} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {editing ? t("form.save") : t("form.submit_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function errorText(t: ReturnType<typeof useTranslations>, code: CouponErrorCode, message?: string) {
  return message ?? t(`errors.${code}`)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-xs font-semibold text-on-surface-muted">{title}</legend>
      {children}
    </fieldset>
  )
}

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  decimal,
  ...aria
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  error: ReactNode
  decimal?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...aria} value={value} onChange={(event) => onChange(event.target.value)} inputMode={decimal ? "decimal" : "numeric"} dir="ltr" className="text-end tabular-nums" />
      <p className="text-xs text-on-surface-muted">{hint}</p>
      {error}
    </div>
  )
}

/** Display-only illustration; the backend computes the real discount at checkout. */
function ExampleLine({ preview, locale }: { preview: { price: string; final: string } | null; locale: string }) {
  const t = useTranslations("adminCoupons")
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted/60 px-3 py-2.5" aria-live="polite" data-testid="coupon-example">
      {preview ? (
        <p className="text-sm">
          <span className="font-semibold">{t("form.example_label")}</span>{" "}
          {t("form.example", {
            price: formatMoney(locale, preview.price, "EGP"),
            final: formatMoney(locale, preview.final, "EGP"),
          })}
        </p>
      ) : (
        <p className="text-sm text-on-surface-muted">{t("form.example_empty")}</p>
      )}
      <p className="mt-0.5 text-xs text-on-surface-muted">{t("form.example_note")}</p>
    </div>
  )
}

function TeacherPicker({ selected, onChange, error }: { selected: number[]; onChange: (ids: number[]) => void; error: ReactNode }) {
  const t = useTranslations("adminCoupons")
  const [committed, setCommitted] = useState("")
  const [draft, setDraft] = useDebouncedSearch(committed, setCommitted)
  const [names, setNames] = useState<Record<number, string>>({})
  const query = useTeachersQuery({ page: 1, limit: 8, search: committed || undefined })
  const results = query.data?.items ?? []

  function toggle(id: number, name: string) {
    setNames((previous) => ({ ...previous, [id]: name }))
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("form.teachers_selected", { count: selected.length })}>
          {selected.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(selected.filter((value) => value !== id))}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-tint/70"
                aria-label={t("form.teacher_remove", { name: names[id] ?? `#${id}` })}
              >
                {names[id] ?? <span dir="ltr">#{id}</span>}
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t("form.teachers_search")}
        aria-label={t("form.teachers_search")}
      />
      <div className="max-h-44 overflow-y-auto rounded-lg border border-border">
        {query.isLoading ? (
          <p className="px-3 py-2 text-xs text-on-surface-muted">{t("form.teachers_loading")}</p>
        ) : query.isError ? (
          <p className="px-3 py-2 text-xs text-destructive">{t("form.teachers_error")}</p>
        ) : results.length === 0 ? (
          <p className="px-3 py-2 text-xs text-on-surface-muted">{t("form.teachers_empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {results.map((teacher) => {
              const checked = selected.includes(teacher.teacher_profile_id)
              return (
                <li key={teacher.teacher_profile_id}>
                  <label className={cn("flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-surface-muted", checked && "bg-primary-tint/40")}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(teacher.teacher_profile_id, teacher.name)}
                      className="size-4 accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate">{teacher.name}</span>
                    <span className="truncate text-xs text-on-surface-muted" dir="ltr">{teacher.email}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {error}
    </div>
  )
}
