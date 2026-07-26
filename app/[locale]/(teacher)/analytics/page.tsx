import { setRequestLocale, getTranslations } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

const MOCK_METRICS = [
  { label: "Total Views", value: "284.5K", change: "+12.3%", trend: "up" },
  { label: "Avg Watch Time", value: "24m 18s", change: "+5.7%", trend: "up" },
  { label: "Completion Rate", value: "78.4%", change: "+3.2%", trend: "up" },
  { label: "Enrollment Rate", value: "12.8%", change: "-1.1%", trend: "down" },
];

const MOCK_CHART_MONTHS = [
  { month: "Jan", views: 4200, enrollments: 48 },
  { month: "Feb", views: 5800, enrollments: 62 },
  { month: "Mar", views: 8400, enrollments: 91 },
  { month: "Apr", views: 6100, enrollments: 75 },
  { month: "May", views: 7800, enrollments: 83 },
  { month: "Jun", views: 7200, enrollments: 79 },
];

const MOCK_TOP_CONTENT = [
  { title: "Mastering Modern UX", views: 45200, engagements: 12300 },
  { title: "Advanced React 2024", views: 38100, engagements: 9800 },
  { title: "Data Science with Python", views: 29400, engagements: 7600 },
  { title: "Financial Management", views: 18300, engagements: 5100 },
];

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const user = await verifySession();
  if (!user) {
    return <Placeholder state="error" error={{ type: "Unauthorized", status: 401, message: "No session" }} />;
  }

  const maxViews = Math.max(...MOCK_CHART_MONTHS.map((m) => m.views));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("analytics.title") ?? "Analytics"}</h1>
        <p className="text-sm text-muted-foreground">Track your content performance and student engagement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold">{metric.value}</p>
            <p className={`mt-1 text-xs ${metric.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
              {metric.change} vs last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Monthly Views & Enrollments</h2>
          <div className="space-y-3">
            {MOCK_CHART_MONTHS.map((m) => (
              <div key={m.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{m.month}</span>
                  <span className="text-muted-foreground">{m.views.toLocaleString()} views</span>
                </div>
                <div className="flex gap-1">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(m.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Top Performing Content</h2>
          <div className="space-y-4">
            {MOCK_TOP_CONTENT.map((item, i) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.views.toLocaleString()} views · {item.engagements.toLocaleString()} engagements
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
