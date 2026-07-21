import { getLocale, getTranslations } from "next-intl/server";
import { Calendar, Plus, Star, Banknote, Users, BookOpen, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { MiniBarChart, MonthlyEarningsChart } from "@/features/dashboard/components/chart-loader";
import type {
  OverviewData,
  OverviewStat,
  StatTrend,
  TopCourse,
  StudentActivity,
  StudentActivityStatus,
  StudentActivityAction,
  StudentActivityTime,
} from "@/features/dashboard/schema";

type OverviewProps = {
  data: OverviewData;
};

const STAT_ICONS = {
  revenue: Banknote,
  students: Users,
  rating: Star,
  courses: BookOpen,
} as const;

const STAT_TINTS = {
  revenue: "bg-primary-tint text-primary",
  students: "bg-primary-tint text-primary",
  rating: "bg-warning-tint text-warning",
  courses: "bg-warning-tint text-warning",
} as const;

const STUDENT_TINTS: Record<StudentActivity["studentTint"], string> = {
  violet: "bg-primary-tint text-primary",
  amber: "bg-warning-tint text-warning",
  emerald: "bg-success-tint text-success",
  rose: "bg-error-tint text-error",
};

const STATUS_TINTS: Record<StudentActivityStatus, string> = {
  success: "bg-success-tint text-success",
  pending: "bg-warning-tint text-warning",
};

export async function Overview({ data }: OverviewProps) {
  const t = await getTranslations("overview");
  const locale = await getLocale();
  const labels: Record<OverviewStat["id"], string> = {
    revenue: t("stats.revenue_label"),
    students: t("stats.students_label"),
    rating: t("stats.rating_label"),
    courses: t("stats.courses_label"),
  };

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-md text-headline-md--line-height font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-md text-body-md--line-height text-on-surface-muted">
            {t("subtitle", { name: data.teacherFirstName })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
          >
            <Calendar className="size-4 text-on-surface-muted" aria-hidden="true" />
            <span>{t("date_range.last_30_days")}</span>
          </Button>
          <Button
            size="lg"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{t("create_course")}</span>
          </Button>
        </div>
      </header>

      <section
        aria-label={t("stats.revenue_label")}
        className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4"
      >
        {data.stats.map((stat) => (
          <StatCard
            key={stat.id}
            stat={stat}
            label={labels[stat.id]}
            locale={locale}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-md xl:grid-cols-3">
        <PerformanceCard
          months={data.performance}
          title={t("performance.title")}
          legend={t("performance.legend")}
        />
        <TopPerformingCard
          courses={data.topCourses}
          title={t("top_performing.title")}
          viewAllLabel={t("top_performing.view_all")}
          studentsCountLabel={(count: number) => t("top_performing.students_count", { count })}
          generateReportLabel={t("top_performing.generate_report")}
          locale={locale}
        />
      </section>

      <StudentActivityCard
        activity={data.activity}
        title={t("activity.title")}
        headers={{
          student: t("activity.headers.student"),
          action: t("activity.headers.action"),
          course: t("activity.headers.course"),
          status: t("activity.headers.status"),
          date: t("activity.headers.date"),
        }}
        actions={{
          completed_lesson: (n: number) => t("activity.actions.completed_lesson", { n }),
          submitted_assignment: t("activity.actions.submitted_assignment"),
          enrolled: t("activity.actions.enrolled"),
        }}
        statuses={{
          success: t("activity.statuses.success"),
          pending: t("activity.statuses.pending"),
        }}
        timeLabel={{
          minutes: (n: number) => t("activity.time.minutes_ago", { n }),
          hours: (n: number) => t("activity.time.hours_ago", { n }),
          days: (n: number) => t("activity.time.days_ago", { n }),
        }}
      />
    </div>
  );
}

function StatCard({
  stat,
  label,
  locale,
}: {
  stat: OverviewStat;
  label: string;
  locale: string;
}) {
  const Icon = STAT_ICONS[stat.id];
  const tint = STAT_TINTS[stat.id];

  return (
    <Card className="flex flex-col gap-3 p-md card-hover">
      <div className="flex items-center justify-between">
        <div
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tint}`}
        >
          <Icon className="size-5" />
        </div>
        <TrendBadge trend={stat.trend} locale={locale} />
      </div>
      <div>
        <p className="text-body-md text-body-md--line-height text-on-surface-muted">
          {label}
        </p>
        <p className="mt-1 text-headline-md text-headline-md--line-height font-semibold text-foreground" dir="ltr">
          {formatStatValue(stat, locale)}
        </p>
      </div>
      <div className="h-12">
        <MiniBarChart
          labels={stat.bars.map((_, i) => `${i}`)}
          values={stat.bars}
          colorVar={
            stat.id === "rating" || stat.id === "courses"
              ? "--color-brand-amber"
              : "--color-brand-indigo"
          }
          mutedColorVar={
            stat.id === "rating" || stat.id === "courses"
              ? "--color-brand-amber-tint"
              : "--color-brand-indigo-tint"
          }
        />
      </div>
    </Card>
  );
}

function TrendBadge({ trend, locale }: { trend: StatTrend; locale: string }) {
  if (trend.kind === "up") {
    return (
      <span
        dir="ltr"
        className="inline-flex items-center gap-0.5 rounded-full bg-success-tint px-2 py-0.5 text-label-sm text-label-sm--line-height font-semibold text-success"
      >
        <ArrowUpRight className="size-3" aria-hidden="true" />
        <span>{formatPercent(trend.value, locale)}</span>
      </span>
    );
  }
  if (trend.kind === "new") {
    return (
      <span
        dir="ltr"
        className="inline-flex items-center rounded-full bg-primary-tint px-2 py-0.5 text-label-sm text-label-sm--line-height font-semibold text-primary"
      >
        <span>{`+${trend.count} New`}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-strong px-2 py-0.5 text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
      Stable
    </span>
  );
}

function PerformanceCard({
  months,
  title,
  legend,
}: {
  months: OverviewData["performance"];
  title: string;
  legend: string;
}) {
  return (
    <Card className="flex flex-col gap-md p-md xl:col-span-2 card-hover">
      <div className="flex items-center justify-between">
        <h2 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1.5 text-body-md text-body-md--line-height text-on-surface-muted">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          <span>{legend}</span>
        </span>
      </div>
      <div className="h-64">
        <MonthlyEarningsChart months={months} ariaLabel={legend} />
      </div>
    </Card>
  );
}

function TopPerformingCard({
  courses,
  title,
  viewAllLabel,
  studentsCountLabel,
  generateReportLabel,
  locale,
}: {
  courses: TopCourse[];
  title: string;
  viewAllLabel: string;
  studentsCountLabel: (count: number) => string;
  generateReportLabel: string;
  locale: string;
}) {
  return (
    <Card className="flex flex-col gap-md p-md card-hover">
      <div className="flex items-center justify-between">
        <h2 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
          {title}
        </h2>
        <Button
          variant="link"
        >
          {viewAllLabel}
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {courses.map((course) => (
          <li
            key={course.id}
            className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-surface-muted"
          >
            <div
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-strong text-2xl"
            >
              <span>{course.thumbnail}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md text-body-md--line-height font-semibold text-foreground">
                {course.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-label-sm text-label-sm--line-height text-on-surface-muted">
                <span>{studentsCountLabel(course.students)}</span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star className="size-3 fill-warning stroke-warning" aria-hidden="true" />
                  <span dir="ltr">{course.rating.toFixed(1)}</span>
                </span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-body-md text-body-md--line-height font-semibold text-foreground" dir="ltr">
                {formatCurrency(course.revenue, locale)}
              </p>
              <p className="mt-0.5 text-label-sm text-label-sm--line-height text-success" dir="ltr">
                +12%
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="outline"
        size="lg"
        className="mt-2 w-full"
      >
        {generateReportLabel}
      </Button>
    </Card>
  );
}

function StudentActivityCard({
  activity,
  title,
  headers,
  actions,
  statuses,
  timeLabel,
}: {
  activity: StudentActivity[];
  title: string;
  headers: { student: string; action: string; course: string; status: string; date: string };
  actions: {
    completed_lesson: (n: number) => string;
    submitted_assignment: string;
    enrolled: string;
  };
  statuses: { success: string; pending: string };
  timeLabel: {
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  };
}) {
  return (
    <Card className="flex flex-col gap-md p-md">
      <h2 className="text-title-lg text-title-lg--line-height font-semibold text-foreground">
        {title}
      </h2>
      <Table>
        <TableHeader>
          <TableRow className="grid grid-cols-[1.4fr_1.4fr_1.6fr_0.8fr_0.8fr] gap-md bg-surface-muted px-md py-2.5 text-label-sm text-label-sm--line-height font-semibold text-on-surface-muted">
            <TableHead>{headers.student}</TableHead>
            <TableHead>{headers.action}</TableHead>
            <TableHead>{headers.course}</TableHead>
            <TableHead>{headers.status}</TableHead>
            <TableHead className="text-end">{headers.date}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((row) => (
            <TableRow
              key={row.id}
              className="grid grid-cols-[1.4fr_1.4fr_1.6fr_0.8fr_0.8fr] items-center gap-md border-b border-border px-md py-3 last:border-b-0"
            >
              <TableCell className="flex items-center gap-2.5">
                <Avatar className={`size-8 shrink-0 ${STUDENT_TINTS[row.studentTint]}`}>
                  <AvatarFallback className="text-label-sm font-semibold">
                    {row.studentInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-body-md text-body-md--line-height font-medium text-foreground">
                  {row.studentName}
                </span>
              </TableCell>
              <TableCell className="truncate text-body-md text-body-md--line-height text-on-surface-muted">
                {formatAction(row.action, actions)}
              </TableCell>
              <TableCell className="truncate text-body-md text-body-md--line-height text-foreground">
                {row.course}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm text-label-sm--line-height font-semibold ${STATUS_TINTS[row.status]}`}
                >
                  {row.status === "success" ? statuses.success : statuses.pending}
                </span>
              </TableCell>
              <TableCell className="text-end text-label-sm text-label-sm--line-height text-on-surface-muted" dir="ltr">
                {formatTime(row.time, timeLabel)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function formatAction(
  action: StudentActivityAction,
  labels: { completed_lesson: (n: number) => string; submitted_assignment: string; enrolled: string },
): string {
  if (action.kind === "completed_lesson") return labels.completed_lesson(action.n);
  if (action.kind === "submitted_assignment") return labels.submitted_assignment;
  return labels.enrolled;
}

function formatStatValue(stat: OverviewStat, locale: string): string {
  const grouping = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 });
  if (stat.id === "revenue") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(stat.value);
  }
  if (stat.id === "rating") {
    return `${stat.value.toFixed(2)} / 5.0`;
  }
  return grouping.format(stat.value);
}

function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value / 100);
}

function formatTime(
  time: StudentActivityTime,
  labels: { minutes: (n: number) => string; hours: (n: number) => string; days: (n: number) => string },
): string {
  if (time.unit === "minutes") return labels.minutes(time.n);
  if (time.unit === "hours") return labels.hours(time.n);
  return labels.days(time.n);
}
