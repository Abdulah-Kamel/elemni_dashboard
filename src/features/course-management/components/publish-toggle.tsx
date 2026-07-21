"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { publishCourse, unpublishCourse } from "@/features/course-management/actions";

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

  const handleClick = useCallback(async () => {
    setState("submitting");

    const action = isPublished ? unpublishCourse : publishCourse;
    const result = await action(courseId, teacherProfileId);

    if (result.success) {
      setState("success");
    } else {
      const err = result.error;
      if (err.type === "Validation") {
        setState("rejected");
      } else {
        setState("network-error");
      }
    }
  }, [courseId, teacherProfileId, isPublished]);

  return (
    <DropdownMenuItem onClick={handleClick} disabled={state === "submitting"}>
      {isPublished ? t("unpublish") : t("publish")}
    </DropdownMenuItem>
  );
}
