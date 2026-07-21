"use client";

import { Button } from "@/components/ui/button";

export default function ChapterPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-12 space-y-4">
      <p className="text-sm text-destructive">
        {error.message || "Something went wrong loading this chapter."}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
