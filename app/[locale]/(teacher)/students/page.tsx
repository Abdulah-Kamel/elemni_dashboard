import { setRequestLocale } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";
import { StudentRoster } from "@/features/students/components/student-roster";
import type { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
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

  return <StudentRoster />;
}