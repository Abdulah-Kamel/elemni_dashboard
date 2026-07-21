import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import {Placeholder} from "@/features/shell/components/placeholder";
import {verifySession} from "@/lib/auth/dal";
import {apiFetch} from "@/lib/api/client";
import {courseOutSchema} from "@/features/shell/schema";

export const dynamic = "force-dynamic";

export default async function LessonsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await verifySession();

  if (!user) {
    return <Placeholder state="error" error={{ type: "Unauthorized", status: 401, message: "No session" }} />;
  }

  try {
    const courses = await apiFetch("/api/v1/courses", courseOutSchema.array());
    const t = await getTranslations({ locale, namespace: "lessons" });

    return (
      <Placeholder state="success">
        <h1 className="text-lg font-medium text-foreground">
          {t("course_count", { count: courses.length })}
        </h1>
      </Placeholder>
    );
  } catch (err) {
    const errorType = (err as Error)?.name?.replace("ApiError:", "") ?? "Upstream";
    return (
      <Placeholder
        state="error"
        error={{ type: errorType, status: 0, message: (err as Error)?.message ?? "Error" } as never}
      />
    );
  }
}