"use client"

import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { DashboardPagination } from "@/components/dashboard-pagination"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listSubscriptionsAction } from "../actions"
import { adminKeys } from "../query-keys"

const PAGE_SIZE = 10

export function SubscriptionsList({
  teacherProfileId,
}: {
  teacherProfileId?: number
}) {
  const t = useTranslations("admin")
  const locale = useLocale()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("completed")
  const [page, setPage] = useState(1)
  const params = {
    page,
    limit: PAGE_SIZE,
    search: useDeferredValue(search) || undefined,
    paymentStatus: status,
    teacherProfileId,
  }
  const query = useQuery({
    queryKey: adminKeys.subscriptions(params),
    queryFn: () => listSubscriptionsAction(params),
  })
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE))
  return (
    <div className="flex flex-col gap-xl">
      {!teacherProfileId && (
        <header className="animate-slide-up border-b border-border pb-5">
          <h1 className="text-headline-md font-semibold">
            {t("title_subscriptions")}
          </h1>
          <p className="mt-1 text-on-surface-muted">
            {t("subscriptions_count", { count: query.data?.total ?? 0 })}
          </p>
        </header>
      )}
      <div className="flex animate-slide-up flex-col gap-3 rounded-2xl border border-border bg-surface p-md shadow-xs animate-stagger-1 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            className="ps-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t("search_subscriptions")}
          />
        </div>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="completed">{t("payment_completed")}</option>
          <option value="pending">{t("payment_pending")}</option>
          <option value="all">{t("status_all")}</option>
        </select>
      </div>
      {query.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="animate-slide-up overflow-hidden rounded-2xl border border-border bg-surface shadow-xs animate-stagger-2">
          <Table className="text-sm">
            <TableHeader className="border-b border-border bg-surface-muted text-on-surface-muted">
              <TableRow>
                <TableHead className="px-4 py-3">
                  {t("table_student")}
                </TableHead>
                <TableHead className="px-4 py-3">{t("table_course")}</TableHead>
                <TableHead className="px-4 py-3">{t("table_status")}</TableHead>
                <TableHead className="px-4 py-3">{t("table_amount")}</TableHead>
                <TableHead className="px-4 py-3">{t("table_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.length ? (
                query.data.items.map((item) => (
                  <TableRow key={item.enrollment_id}>
                    <TableCell className="px-4 py-3">
                      <p className="font-medium">{item.student_name}</p>
                      <p className="text-xs text-on-surface-muted">
                        {item.student_email}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {item.course.title}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={
                          item.payment_status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {item.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold" dir="ltr">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: item.currency,
                      }).format(Number(item.total_paid))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-on-surface-muted">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(item.purchased_at))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-on-surface-muted"
                  >
                    {t("no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <DashboardPagination
        currentPage={page}
        totalPages={pages}
        totalItems={query.data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: (current, totalPages) =>
            t("pagination", { page: current, pages: totalPages }),
          summary: (from, to, total) => t("showing", { from, to, total }),
        }}
      />
    </div>
  )
}
