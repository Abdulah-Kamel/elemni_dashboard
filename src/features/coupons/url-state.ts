// URL <-> filter state for the coupons list, following the admin lists'
// conventions (see features/admin/url-state.ts): defaults are omitted from the
// query string so tiles and attention rows can deep-link with short URLs.
import { parseSort, type ParamReader } from "@/features/admin/url-state"
import type { SortState } from "@/lib/sort"
import { COUPON_CODE_PATTERN, COUPON_STATUS_FILTERS, type CouponListQuery, type CouponSortField } from "./schema"

export const COUPON_STATUS_OPTIONS = ["all", ...COUPON_STATUS_FILTERS] as const
export type CouponStatusOption = (typeof COUPON_STATUS_OPTIONS)[number]

/**
 * Attention views the list endpoint cannot filter by. They load one page of
 * active coupons (the API maximum) and narrow it on the client — a display
 * flag, not a status.
 */
export const COUPON_FLAGS = ["none", "expiring", "near_cap"] as const
export type CouponFlag = (typeof COUPON_FLAGS)[number]

export const COUPON_SORT_KEYS = ["code", "discount", "usage", "validity", "status", "created"] as const
export type CouponSortKey = (typeof COUPON_SORT_KEYS)[number]

/** Table column → API `sort_by`. */
export const SORT_FIELD: Record<CouponSortKey, CouponSortField> = {
  code: "code",
  discount: "value",
  usage: "used_count",
  validity: "expires_at",
  status: "status",
  created: "created_at",
}

export type CouponFilters = {
  q: string
  status: CouponStatusOption
  flag: CouponFlag
  sort: SortState<CouponSortKey> | null
  page: number
  /** Code of the coupon open in the side panel. */
  view: string | null
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function parseCouponFilters(params: ParamReader): CouponFilters {
  const view = (params.get("view") ?? "").trim().toUpperCase()
  const flag = oneOf(params.get("flag"), COUPON_FLAGS, "none")
  return {
    q: (params.get("q") ?? "").trim().slice(0, 200),
    // A flag view always narrows active coupons, so it owns the status.
    status: flag === "none" ? oneOf(params.get("status"), COUPON_STATUS_OPTIONS, "all") : "active",
    flag,
    sort: parseSort(params, COUPON_SORT_KEYS),
    page: positiveInt(params.get("page")) ?? 1,
    view: COUPON_CODE_PATTERN.test(view) ? view : null,
  }
}

export function serializeCouponFilters(filters: CouponFilters): URLSearchParams {
  const out = new URLSearchParams()
  if (filters.flag !== "none") out.set("flag", filters.flag)
  else if (filters.status !== "all") out.set("status", filters.status)
  if (filters.q) out.set("q", filters.q)
  if (filters.sort) {
    out.set("sort", filters.sort.key)
    if (filters.sort.direction === "desc") out.set("dir", "desc")
  }
  if (filters.page > 1) out.set("page", String(filters.page))
  if (filters.view) out.set("view", filters.view)
  return out
}

export const COUPON_PAGE_SIZE = 10
/** API maximum page size; flag views scan one page of this size. */
export const COUPON_SCAN_LIMIT = 100

/** The list request for the current filters. Flag views request the scan page. */
export function listQueryFor(filters: CouponFilters): CouponListQuery {
  const sort = filters.sort ? { sort_by: SORT_FIELD[filters.sort.key], sort_order: filters.sort.direction } : {}
  if (filters.flag !== "none") return scanQuery(filters.q)
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...sort,
    skip: (filters.page - 1) * COUPON_PAGE_SIZE,
    limit: COUPON_PAGE_SIZE,
  }
}

/** One page of active coupons, soonest expiry first — shared by the attention panel and flag views. */
export function scanQuery(q = ""): CouponListQuery {
  return { ...(q ? { q } : {}), status: "active", sort_by: "expires_at", sort_order: "asc", skip: 0, limit: COUPON_SCAN_LIMIT }
}
