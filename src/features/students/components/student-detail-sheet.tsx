"use client"

import { useLocale, useTranslations } from "next-intl"
import { BookOpen, Mail, MessageCircle, Phone, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Link } from "@/i18n/routing"
import { PaymentStatusBadge } from "@/features/billing/components/payment-status-badge"
import { cn } from "@/lib/utils"
import {
  getAccessState,
  type StudentSubscriptionRow,
} from "@/features/students/roster-model"
import { formatAmount } from "@/features/students/format"

type Props = {
  /** Every subscription row this teacher has for the selected student. */
  subscriptions: StudentSubscriptionRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilterCourse: (courseId: number) => void
  now: number
}

/**
 * Side panel with everything the teacher knows about one student: contact
 * details, every subscription with this teacher, and how long access lasts.
 */
export function StudentDetailSheet({
  subscriptions,
  open,
  onOpenChange,
  onFilterCourse,
  now,
}: Props) {
  const tClose = useTranslations("dashboardShell")
  const tw = useTranslations("teacherWorkspace.students")
  const locale = useLocale()
  const student = subscriptions[0]
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  const ordered = [...subscriptions].sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  )

  const contacts = student
    ? [
        { id: "email", icon: Mail, label: tw("contact_email"), value: student.email, href: `mailto:${student.email}` },
        student.studentPhone
          ? { id: "phone", icon: Phone, label: tw("contact_phone"), value: student.studentPhone, href: `tel:${student.studentPhone}` }
          : null,
        student.whatsapp
          ? { id: "whatsapp", icon: MessageCircle, label: tw("contact_whatsapp"), value: student.whatsapp, href: `tel:${student.whatsapp}` }
          : null,
        student.parentPhone
          ? { id: "parent", icon: Users, label: tw("contact_parent"), value: student.parentPhone, href: `tel:${student.parentPhone}` }
          : null,
      ].filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  return (
    <Sheet open={open && Boolean(student)} onOpenChange={onOpenChange}>
      <SheetContent closeLabel={tClose("close")}
        side={locale === "ar" ? "left" : "right"}
        className="w-full gap-0 bg-surface data-[side=left]:w-full data-[side=right]:w-full sm:data-[side=left]:max-w-[30rem] sm:data-[side=right]:max-w-[30rem] motion-reduce:transition-none"
      >
        {student ? (
          <>
            <SheetHeader className="border-b border-border p-5 pe-12">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 bg-primary-tint text-primary">
                  <AvatarFallback className="text-sm font-semibold">
                    {student.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base font-semibold">
                    {student.name}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-on-surface-muted">
                    {[student.grade, student.stream].filter(Boolean).join(" · ") ||
                      tw("subscriptions_count", { count: subscriptions.length })}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <section aria-labelledby="student-contact-title" className="border-b border-border p-5">
              <h3 id="student-contact-title" className="text-xs font-semibold text-on-surface-muted">
                {tw("contact_title")}
              </h3>
              <ul className="mt-2 space-y-1">
                {contacts.map(({ id, icon: Icon, label, value, href }) => (
                  <li key={id}>
                    <a
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Icon className="size-4 shrink-0 text-on-surface-muted" aria-hidden="true" />
                      <span className="w-24 shrink-0 text-xs text-on-surface-muted">{label}</span>
                      <span className="min-w-0 truncate text-foreground" dir="ltr">
                        {value}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="student-subscriptions-title" className="p-5">
              <h3 id="student-subscriptions-title" className="text-xs font-semibold text-on-surface-muted">
                {tw("subscriptions_title", { count: subscriptions.length })}
              </h3>
              <ul className="mt-3 space-y-2">
                {ordered.map((subscription) => {
                  const access = getAccessState(subscription, now)
                  return (
                    <li
                      key={subscription.enrollmentId}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {subscription.course}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-muted tabular-nums">
                            {dateFormatter.format(new Date(subscription.purchasedAt))}
                            {" → "}
                            {dateFormatter.format(new Date(subscription.expiresAt))}
                          </p>
                        </div>
                        <PaymentStatusBadge status={subscription.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {formatAmount(subscription.totalPaid, subscription.currency, locale)}
                        </span>
                        <AccessChip access={access} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => onFilterCourse(subscription.courseId)}
                          className="inline-flex items-center gap-1 rounded-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <Users className="size-3.5" aria-hidden="true" />
                          {tw("course_students")}
                        </button>
                        <Link
                          href={`/courses/${subscription.courseId}`}
                          className="inline-flex items-center gap-1 rounded-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <BookOpen className="size-3.5" aria-hidden="true" />
                          {tw("open_course")}
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 text-xs text-on-surface-muted">{tw("amount_note")}</p>
            </section>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function AccessChip({ access }: { access: ReturnType<typeof getAccessState> }) {
  const tw = useTranslations("teacherWorkspace.students")
  if (access.kind === "none") {
    return <span className="text-xs text-on-surface-muted">{tw("access_none")}</span>
  }
  if (access.kind === "expired") {
    return (
      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-on-surface-muted">
        {tw("access_expired")}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        access.expiring ? "bg-warning-tint text-warning" : "bg-success-tint text-success"
      )}
    >
      {tw("days_left", { count: access.daysLeft })}
    </span>
  )
}
