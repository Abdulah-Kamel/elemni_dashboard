"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCourseTest } from "../actions";

export function NewTestButton({ courseId, label }: { courseId: number; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  async function create() {
    setBusy(true);
    try {
      const test = await createCourseTest(courseId);
      startTransition(() => router.push(`/courses/${courseId}/tests/${test.id}`));
    } catch {
      toast.error("تعذر إنشاء الاختبار. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  return <Button onClick={create} disabled={busy || isPending}>{busy || isPending ? "جارٍ الإنشاء…" : label}</Button>;
}
