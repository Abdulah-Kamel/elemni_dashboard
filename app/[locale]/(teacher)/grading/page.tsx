import { setRequestLocale } from "next-intl/server";
import { GradingDemoPage } from "@/features/course-tests/components/grading-demo-page";

export default async function GradingPage({ searchParams, params }: { searchParams: Promise<{ testId?: string; status?: string }>; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { testId, status = "pending" } = await searchParams;
  setRequestLocale(locale);
  return <GradingDemoPage testId={testId ? Number(testId) : undefined} status={status} />;
}
