import { setRequestLocale, getTranslations } from "next-intl/server";
import { Placeholder } from "@/features/shell/components/placeholder";
import { verifySession } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

const MOCK_INVOICES = [
  { id: "INV-2024-001", date: "2024-06-01", plan: "Professional Monthly", amount: 49.99, status: "paid" as const },
  { id: "INV-2024-002", date: "2024-05-01", plan: "Professional Monthly", amount: 49.99, status: "paid" as const },
  { id: "INV-2024-003", date: "2024-04-01", plan: "Professional Monthly", amount: 49.99, status: "paid" as const },
  { id: "INV-2024-004", date: "2024-03-01", plan: "Professional Monthly", amount: 49.99, status: "paid" as const },
  { id: "INV-2024-005", date: "2024-02-01", plan: "Startup Monthly", amount: 29.99, status: "paid" as const },
  { id: "INV-2024-006", date: "2024-01-01", plan: "Startup Monthly", amount: 29.99, status: "paid" as const },
];

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function BillingPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("billing.title") ?? "Billing"}</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and payment history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Current Plan</p>
          <p className="mt-1 text-xl font-bold">Professional</p>
          <p className="text-sm text-muted-foreground">$49.99 / month</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <p className="mt-1 text-xl font-bold text-emerald-500">Active</p>
          <p className="text-sm text-muted-foreground">Renews on Jul 1, 2024</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-xl font-bold">$259.94</p>
          <p className="text-sm text-muted-foreground">Since Jan 2024</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Invoice History</h2>
        </div>
        <div className="divide-y divide-border">
          {MOCK_INVOICES.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{inv.id}</span>
                <span className="text-sm text-muted-foreground">{inv.date}</span>
                <span className="text-sm">{inv.plan}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">${inv.amount.toFixed(2)}</span>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[inv.status]}`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
