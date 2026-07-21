"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChapterOut } from "@/features/course-management/chapters-schema";

export function ReorderButtons({
  chapter,
  chapters,
  onMoveUp,
  onMoveDown,
  moveUpLabel,
  moveDownLabel,
}: {
  chapter: ChapterOut;
  chapters: ChapterOut[];
  onMoveUp: (chapterId: number) => void;
  onMoveDown: (chapterId: number) => void;
  moveUpLabel: string;
  moveDownLabel: string;
}) {
  const index = chapters.findIndex((ch) => ch.id === chapter.id);
  const isFirst = index === 0;
  const isLast = index === chapters.length - 1;

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        disabled={isFirst}
        onClick={() => onMoveUp(chapter.id)}
        aria-label={moveUpLabel}
        className={isFirst ? "opacity-30 cursor-not-allowed" : ""}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={isLast}
        onClick={() => onMoveDown(chapter.id)}
        aria-label={moveDownLabel}
        className={isLast ? "opacity-30 cursor-not-allowed" : ""}
      >
        <ChevronDown className="size-4" />
      </Button>
    </>
  );
}
