import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClipboardList, Clock3, FileCheck2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewTestButton } from "@/features/course-tests/components/new-test-button";
import { getCourseTestStats, listCourseTests } from "@/features/course-tests/actions";

export const dynamic = "force-dynamic";

function isFuture(value: string | null) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

export default async function CourseTestsPage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId: rawId } = await params;
  setRequestLocale(locale);
  const courseId = Number(rawId);
  if (!Number.isInteger(courseId) || courseId < 1) notFound();
  const t = await getTranslations({ locale, namespace: "courseTests" });
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent("type,text,points,options,answer_key\nsingle,نص السؤال,2,[],'{\\\"option_id\\\":\\\"a\\\"}'\n")}`;
  const [tests, stats] = await Promise.all([listCourseTests(courseId), getCourseTestStats(courseId)]);
  const cards = [
    { label: t("published"), value: stats.published_tests, icon: ClipboardList },
    { label: t("pending"), value: stats.pending_grading, icon: Clock3 },
    { label: t("average_score"), value: stats.average_score == null ? "—" : `${stats.average_score}%`, icon: FileCheck2 },
    { label: t("pass_rate"), value: stats.pass_rate == null ? "—" : `${stats.pass_rate}%`, icon: FileCheck2 },
  ];
  return <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><nav aria-label={t("breadcrumb")} className="mb-2 text-sm text-muted-foreground"><Link href={`/courses/${courseId}`}>{t("course")}</Link> / {t("title")}</nav><h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1><p className="mt-1 text-muted-foreground">{t("description")}</p></div>
      <div className="flex flex-wrap gap-2"><NewTestButton courseId={courseId} label={t("new_test")} /><Button variant="outline" render={<a href={templateHref} download="course-tests-template.csv" />}>{t("download_template")}</Button></div>
    </header>
    <section aria-label={t("statistics")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="size-4 text-muted-foreground" aria-hidden="true" /></CardHeader><CardContent><p className="text-2xl font-bold tabular-nums">{value}</p></CardContent></Card>)}</section>
    <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b p-4"><h2 className="font-semibold">{t("all_tests")}</h2></div>{tests.length ? <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr>{[t("test_name"), t("placement"), t("questions_points"), t("duration"), t("attempts"), t("status"), t("submissions"), t("actions")].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y">{tests.map((test) => { const scheduled = test.status === "published" && isFuture(test.opens_at); return <tr key={test.id} className="align-middle"><td className="min-w-52 px-4 py-4"><Link href={`/courses/${courseId}/tests/${test.id}`} className="font-semibold text-primary hover:underline">{test.title}</Link></td><td className="px-4 py-4">{test.placement === "inside_item" ? t("inside_item") : t("standalone")}</td><td className="px-4 py-4 tabular-nums">{test.question_count} · {test.total_points}</td><td className="px-4 py-4">{test.time_limit_minutes ? t("minutes", { count: test.time_limit_minutes }) : t("no_limit")}</td><td className="px-4 py-4">{test.max_attempts ?? t("unlimited")}</td><td className="px-4 py-4"><Badge variant={scheduled ? "secondary" : test.status === "published" ? "default" : "outline"}>{scheduled ? t("scheduled") : t(`status_${test.status}`)}</Badge></td><td className="px-4 py-4">{t("submission_count", { count: 0 })}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><Button size="sm" variant="outline" render={<Link href={`/courses/${courseId}/tests/${test.id}`} />}>{t("edit")}</Button>{test.status === "published" && <Button size="sm" variant="ghost" render={<Link href={`/grading?testId=${test.id}`} />}>{t("grade")}</Button>}</div></td></tr>; })}</tbody></table></div> : <div className="grid min-h-56 place-items-center p-8 text-center"><div><Plus className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{t("empty_title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("empty_description")}</p><div className="mt-4"><NewTestButton courseId={courseId} label={t("new_test")} /></div></div></div>}</section>
  </div>;
}
