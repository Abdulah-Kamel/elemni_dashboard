import { setRequestLocale } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";
import { getOverviewData } from "@/features/dashboard/queries";
import { Overview } from "@/features/dashboard/components/overview";
import type { ApiError } from "@/lib/api/errors";
import type { OverviewData } from "@/features/dashboard/schema";

export const dynamic = "force-dynamic";

type DashboardResult =
  | { kind: "ready"; data: OverviewData }
  | { kind: "error"; error: ApiError }
  | { kind: "unauthorized" };

async function loadOverview(teacherName: string): Promise<DashboardResult> {
  try {
    const data = await getOverviewData(teacherName);
    return { kind: "ready", data };
  } catch (err) {
    const name = (err as Error)?.name ?? "";
    const errorType = name.replace("ApiError:", "") || "Upstream";
    return {
      kind: "error",
      error: {
        type: errorType,
        status: 0,
        message: (err as Error)?.message ?? "Error",
      } as ApiError,
    };
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();
  if (!user) {
    return (
      <Placeholder
        state="error"
        error={{ type: "Unauthorized", status: 401, message: "No session" } satisfies ApiError}
      />
    );
  }

  const result = await loadOverview(user.name);
  if (result.kind === "ready") {
    return <Overview data={result.data} />;
  }
  if (result.kind === "unauthorized") {
    return (
      <Placeholder
        state="error"
        error={{ type: "Unauthorized", status: 401, message: "No session" } satisfies ApiError}
      />
    );
  }
  return <Placeholder state="error" error={result.error} />;
}
