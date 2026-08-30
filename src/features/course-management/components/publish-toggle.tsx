"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries";

type ToggleState = "idle" | "submitting" | "success" | "rejected" | "network-error";

export function PublishToggle({
  courseId,
  teacherProfileId,
  isPublished,
}: {
  courseId: number;
  teacherProfileId: number;
  isPublished: boolean;
}) {
  const t = useTranslations("courses");
  const [state, setState] = useState<ToggleState>("idle");
  const { publish, unpublish } = useCourseMutations(teacherProfileId);

  const handleClick = useCallback(async () => {
    setState("submitting");

    try {
      const mutation = isPublished ? unpublish : publish;
      await mutation.mutateAsync(courseId);
      setState("success");
    } catch (error) {
      const type =
        error && typeof error === "object" && "type" in error
          ? error.type
          : null;
      setState(type === "Validation" ? "rejected" : "network-error");
    }
  }, [courseId, isPublished, publish, unpublish]);

  return (
    <DropdownMenuItem onClick={handleClick} disabled={state === "submitting"}>
      {isPublished ? t("unpublish") : t("publish")}
    </DropdownMenuItem>
  );
}
