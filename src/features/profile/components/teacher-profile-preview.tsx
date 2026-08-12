import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  GraduationCap,
  Layers3,
  Share2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CourseOut } from "@/features/shell/schema";
import type { TeacherProfile } from "@/features/profile/schema";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { Link } from "@/i18n/routing";

type TeacherProfilePreviewProps = {
  profile: TeacherProfile;
  courses: CourseOut[];
  publicImageUrl: string | null;
  locale: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatPrice(price: string, locale: string): string {
  const value = Number(price);
  if (!Number.isFinite(value)) return price;

  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value);
}

export async function TeacherProfilePreview({
  profile,
  courses,
  publicImageUrl,
  locale,
}: TeacherProfilePreviewProps) {
  const t = await getTranslations({ locale, namespace: "profile" });
  const subjectNames = new Map(profile.subjects.map((subject) => [subject.id, subject.name]));
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-xl">
      <header className="flex flex-col gap-md rounded-2xl border border-primary/20 bg-primary-tint/50 p-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Eye className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title-lg font-semibold text-foreground">{t("student_preview_title")}</h1>
              <Badge variant="secondary" className="bg-surface text-primary">
                {t("preview_badge")}
              </Badge>
            </div>
            <p className="mt-1 text-body-md text-on-surface-muted">{t("student_preview_description")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-sm">
          <EditProfileDialog profile={profile} publicImageUrl={publicImageUrl} />
          <Button variant="outline" render={<Link href="/courses" />} className="bg-surface">
            {t("manage_courses")}
            <Arrow data-icon="inline-end" />
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex flex-col gap-xl p-xl md:flex-row md:items-center">
          <Avatar className="size-32 rounded-2xl border border-primary/15 bg-primary-tint text-primary shadow-xs after:rounded-2xl">
            {publicImageUrl && (
              <AvatarImage src={publicImageUrl} alt={profile.name} className="rounded-2xl" />
            )}
            <AvatarFallback className="flex-col rounded-2xl bg-primary-tint text-primary">
              <UserRound className="size-9" aria-hidden="true" />
              <span className="mt-2 block text-title-lg font-bold">{initials(profile.name)}</span>
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-sm">
            <div className="flex flex-wrap gap-2">
              {profile.subjects.slice(0, 4).map((subject) => (
                <Badge key={subject.id} variant="secondary" className="bg-primary-tint text-primary">
                  {subject.name}
                </Badge>
              ))}
            </div>
            <h2 className="text-headline-md font-bold text-foreground">{profile.name}</h2>
            <p className="w-full text-body-md leading-6 text-on-surface-muted">
              {profile.description || t("bio_empty")}
            </p>
            {profile.grades.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-muted">
                <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                {profile.grades.map((grade) => (
                  <span key={grade.id}>{grade.name}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-sm md:w-40 md:items-stretch">
            <Button size="lg" className="h-10 px-lg" disabled>
              {t("start_learning")}
              <Arrow data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="lg" className="h-10" disabled>
              <Share2 data-icon="inline-start" />
              {t("share_profile")}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-md sm:grid-cols-3" aria-label={t("public_stats")}>
        <PreviewStat icon={BookOpen} value={courses.length} label={t("stats_published_courses")} />
        <PreviewStat icon={GraduationCap} value={profile.grades.length} label={t("stats_grade_levels")} />
        <PreviewStat icon={Layers3} value={profile.subjects.length} label={t("stats_subjects")} />
      </section>

      <section className="space-y-md">
        <div className="flex items-end justify-between gap-md">
          <div>
            <h2 className="text-headline-sm font-bold text-foreground">{t("published_courses_title")}</h2>
            <p className="mt-1 text-body-md text-on-surface-muted">{t("published_courses_description")}</p>
          </div>
          <span className="shrink-0 text-label-md font-medium text-on-surface-muted">
            {t("courses_count", { count: courses.length })}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <BookOpen className="mx-auto size-10 text-on-surface-subtle" aria-hidden="true" />
            <h3 className="mt-md text-title-md font-semibold text-foreground">{t("no_published_courses")}</h3>
            <p className="mt-1 text-body-md text-on-surface-muted">{t("no_published_courses_description")}</p>
            <Button render={<Link href="/courses" />} className="mt-md">
              {t("manage_courses")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <PreviewCourseCard
                key={course.id}
                course={course}
                subjectName={
                  course.subject_name ??
                  (course.subject_id ? subjectNames.get(course.subject_id) : undefined)
                }
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PreviewStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-lg text-center shadow-xs">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary-tint text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-sm text-headline-sm font-bold text-foreground">{value}</p>
      <p className="mt-1 text-label-md text-on-surface-muted">{label}</p>
    </article>
  );
}

async function PreviewCourseCard({
  course,
  subjectName,
  locale,
}: {
  course: CourseOut;
  subjectName?: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "profile" });
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <article className="flex min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-tint via-surface-muted to-primary/15">
        <div className="absolute -start-8 -top-10 size-32 rounded-full border-[18px] border-primary/10" />
        <div className="absolute -bottom-14 -end-8 size-40 rounded-full border-[22px] border-primary/10" />
        <BookOpen className="relative size-12 text-primary/70" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-md">
        {subjectName && (
          <Badge variant="secondary" className="mb-sm bg-primary-tint text-primary">
            {subjectName}
          </Badge>
        )}
        <h3 className="line-clamp-2 text-title-md font-bold text-foreground">{course.title}</h3>
        <p className="mt-sm line-clamp-2 min-h-10 text-label-md leading-5 text-on-surface-muted">
          {course.description || t("course_description_empty")}
        </p>
        <div className="mt-auto flex items-end justify-between gap-md border-t border-border pt-md">
          <div>
            <p className="text-label-sm text-on-surface-muted">{t("course_price")}</p>
            <p className="text-title-md font-bold text-foreground">
              {Number(course.price) === 0 ? t("free") : formatPrice(course.price, locale)}
            </p>
          </div>
          <Button render={<Link href={`/courses/${course.id}`} />} size="sm">
            {t("view_course")}
            <Arrow data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </article>
  );
}
