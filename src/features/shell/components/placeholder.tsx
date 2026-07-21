"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api/errors";

type PlaceholderState = "loading" | "empty" | "error" | "success";

type PlaceholderProps = {
  state: PlaceholderState;
  children?: React.ReactNode;
  error?: ApiError | null;
};

const errorKeyMap: Record<string, string> = {
  Unauthorized: "error_unauthorized",
  Forbidden: "error_forbidden",
  NotFound: "error_not_found",
  Validation: "error_validation",
  RateLimited: "error_rate_limited",
  Conflict: "error_conflict",
  Upstream: "error_upstream",
};

export function Placeholder({ state, children, error }: PlaceholderProps) {
  const t = useTranslations("placeholder");

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3 p-6" aria-busy="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  if (state === "error") {
    const errorType = error?.type ?? "Upstream";
    const messageKey = errorKeyMap[errorType] ?? "error_upstream";
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <p className="text-sm text-destructive">{t(messageKey)}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("p-6")}>
      {children}
    </div>
  );
}