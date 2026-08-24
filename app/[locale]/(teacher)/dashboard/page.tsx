import { setRequestLocale } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";
import {
  getTeacherAnalytics,
  listTopEarningCourses,
} from "@/features/analytics/queries";
import { Overview } from "@/features/dashboard/components/overview";
import type { ApiError } from "@/lib/api/errors";
import type {
  TeacherAnalytics,
  TopEarningCourse,
} from "@/features/analytics/schema";

export const dynamic = "force-dynamic";

type DashboardResult =
  | {
      kind: "ready";
      summary: TeacherAnalytics;
      topCourses: TopEarningCourse[];
    }
  | { kind: "error"; error: ApiError }
  | { kind: "unauthorized" };

function normalizeDateParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

async function loadOverview(filters: {
  start?: string;
  end?: string;
}): Promise<DashboardResult> {
  try {
    const [summary, topCourses] = await Promise.all([
      getTeacherAnalytics(filters),
      listTopEarningCourses({ ...filters, limit: 5 }),
    ]);
    return { kind: "ready", summary, topCourses };
  } catch (err) {
    const error = err as Error & {
      type?: ApiError["type"];
      status?: number;
    };
    if (error.type === "Unauthorized") {
      return { kind: "unauthorized" };
    }
    return {
      kind: "error",
      error: {
        type: error.type ?? "Upstream",
        status: error.status ?? 0,
        message: error.message ?? "Error",
      } as ApiError,
    };
  }
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

  const query = await searchParams;
  const filters = {
    start: normalizeDateParam(query.start),
    end: normalizeDateParam(query.end),
  };
  const result = await loadOverview(filters);
  if (result.kind === "ready") {
    const teacherFirstName = user.name.split(/\s+/)[0] ?? user.name;
    return (
      <Overview
        teacherFirstName={teacherFirstName}
        summary={result.summary}
        topCourses={result.topCourses}
        filters={filters}
      />
    );
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
