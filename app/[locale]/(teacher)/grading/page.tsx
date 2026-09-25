import { setRequestLocale } from "next-intl/server";
import { getGradingQueue } from "@/features/course-tests/actions";
import { GradingQueue } from "@/features/course-tests/components/grading-queue";

export const dynamic = "force-dynamic";

export default async function GradingPage({ searchParams, params }: { searchParams: Promise<{ testId?: string; status?: string }>; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { testId, status = "pending" } = await searchParams;
  setRequestLocale(locale);
  const items = await getGradingQueue(testId ? Number(testId) : undefined, status);
  return <div className="space-y-5"><header><h1 className="text-3xl font-bold">التصحيح</h1><p className="mt-1 text-muted-foreground">راجع إجابات المقال وسجّل الدرجة والملاحظات.</p></header><GradingQueue initialItems={items} /></div>;
}
