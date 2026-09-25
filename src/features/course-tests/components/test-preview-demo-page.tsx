"use client";

import { useSyncExternalStore } from "react";
import { getCourseTestSnapshot, subscribeDemoCourseTests } from "@/features/course-tests/demo-store";
import type { CourseTest } from "@/features/course-tests/types";

export function TestPreviewDemoPage({ courseId, testId }: { courseId: number; testId: number }) {
  const snapshot = useSyncExternalStore(subscribeDemoCourseTests, () => getCourseTestSnapshot(testId), () => "");
  if (!snapshot) return <main className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">جارٍ تحميل معاينة الاختبار التجريبي…</main>;
  if (snapshot === "null") return <main className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">الاختبار غير موجود في بيانات العرض التجريبي.</main>;
  const storedTest = JSON.parse(snapshot) as CourseTest;
  if (storedTest.course_id !== courseId && storedTest.course_id !== 12) return <main className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">الاختبار غير موجود في بيانات العرض التجريبي.</main>;
  const test = { ...storedTest, course_id: courseId };
  return <main dir="rtl" className="mx-auto max-w-3xl space-y-5 py-8">
    <header className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">معاينة للمدرّس · لن تُحفظ أي محاولة</p><h1 className="mt-2 text-2xl font-bold">{test.title}</h1>{test.description && <p className="mt-2 leading-7">{test.description}</p>}<p className="mt-3 text-sm text-muted-foreground">{test.questions.length} سؤال · {test.time_limit_minutes ? `${test.time_limit_minutes} دقيقة` : "بلا حد زمني"}</p></header>
    {test.questions.map((question, index) => <article key={question.id} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>السؤال {index + 1}</span><span>{question.points} نقاط</span></div><h2 className="mt-3 font-semibold leading-7">{question.text}</h2>{question.code_snippet && <pre dir="ltr" className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-start"><code>{question.code_snippet}</code></pre>}{question.image_url && <img src={question.image_url} alt="صورة السؤال" className="mt-3 max-h-72 rounded-lg object-contain" />}{question.options.map((option) => <p key={option.id} className="mt-2 rounded-lg border p-3">{option.text}</p>)}</article>)}
  </main>;
}
