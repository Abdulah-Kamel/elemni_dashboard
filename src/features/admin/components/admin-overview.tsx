import { Banknote, GraduationCap, ReceiptText, Users } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { AdminOverview, AdminSubscriptionPage, AdminTeacherPage } from "../schema"

export async function AdminOverviewView({ overview, teachers, subscriptions }: { overview: AdminOverview; teachers: AdminTeacherPage; subscriptions: AdminSubscriptionPage }) {
  const t = await getTranslations("admin")
  const locale = await getLocale()
  const stats = [
    { label: t("overview_teachers"), value: `${overview.active_teacher_total}/${overview.teacher_total}`, icon: GraduationCap },
    { label: t("overview_students"), value: `${overview.active_student_total}/${overview.student_total}`, icon: Users },
    { label: t("overview_subscriptions"), value: String(overview.completed_subscription_total), icon: ReceiptText },
    { label: t("overview_revenue"), value: new Intl.NumberFormat(locale, { style: "currency", currency: overview.currency }).format(Number(overview.collected_revenue)), icon: Banknote },
  ]
  const stagger = ["animate-stagger-1", "animate-stagger-2", "animate-stagger-3", "animate-stagger-4"]
  return <div className="flex flex-col gap-xl">
    <header className="animate-slide-up"><h1 className="text-headline-md font-semibold">{t("overview_title")}</h1><p className="mt-1 text-on-surface-muted">{t("overview_subtitle")}</p></header>
    <section className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }, index) => <Card key={label} className={`card-hover animate-slide-up ${stagger[index]} gap-4 rounded-2xl border-border p-md shadow-xs`}><div className="flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary"><Icon className="size-5" /></div><div><p className="text-sm font-semibold text-on-surface-muted">{label}</p><p className="mt-1 text-2xl font-bold text-primary" dir="ltr">{value}</p></div></Card>)}</section>
    <section className="grid gap-md xl:grid-cols-2">
      <Card className="animate-slide-up animate-stagger-5 rounded-2xl border-border p-md shadow-xs"><div className="mb-4 flex justify-between"><h2 className="text-title-lg font-semibold">{t("recent_teachers")}</h2><Link href="/admin/teachers" className="text-sm font-semibold text-primary">{t("view_all")}</Link></div><div className="space-y-2">{teachers.items.map((teacher) => <Link href={`/admin/teachers/${teacher.id}` as never} key={teacher.id} className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-surface-muted"><div><p className="font-medium">{teacher.name}</p><p className="text-xs text-on-surface-muted">{teacher.email}</p></div><Badge variant={teacher.is_active ? "default" : "secondary"}>{teacher.is_active ? t("status_active") : t("status_inactive")}</Badge></Link>)}</div></Card>
      <Card className="animate-slide-up animate-stagger-6 rounded-2xl border-border p-md shadow-xs"><div className="mb-4 flex justify-between"><h2 className="text-title-lg font-semibold">{t("recent_subscriptions")}</h2><Link href="/admin/subscriptions" className="text-sm font-semibold text-primary">{t("view_all")}</Link></div><div className="space-y-2">{subscriptions.items.map((item) => <div key={item.enrollment_id} className="flex items-center justify-between rounded-xl p-2"><div><p className="font-medium">{item.student_name}</p><p className="text-xs text-on-surface-muted">{item.course.title}</p></div><p className="font-semibold" dir="ltr">{new Intl.NumberFormat(locale, { style: "currency", currency: item.currency }).format(Number(item.total_paid))}</p></div>)}</div></Card>
    </section>
  </div>
}
