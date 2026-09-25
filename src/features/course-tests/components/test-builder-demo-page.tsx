"use client";

import { useSyncExternalStore } from "react";
import { getCourseTestSnapshot, subscribeDemoCourseTests } from "@/features/course-tests/demo-store";
import { TestBuilder } from "@/features/course-tests/components/test-builder";
import type { CourseTest } from "@/features/course-tests/types";

export function TestBuilderDemoPage({ courseId, testId }: { courseId: number; testId: number }) {
  const snapshot = useSyncExternalStore(subscribeDemoCourseTests, () => getCourseTestSnapshot(testId), () => "");
  if (!snapshot) return <p className="py-16 text-center text-muted-foreground">جارٍ تحميل الاختبار التجريبي…</p>;
  if (snapshot === "null") return <p className="rounded-xl border p-6">الاختبار غير موجود في بيانات العرض التجريبي.</p>;
  const storedTest = JSON.parse(snapshot) as CourseTest;
  if (storedTest.course_id !== courseId && storedTest.course_id !== 12) return <p className="rounded-xl border p-6">الاختبار غير موجود في بيانات العرض التجريبي.</p>;
  const test = { ...storedTest, course_id: courseId };
  return <TestBuilder initialTest={test} />;
}
