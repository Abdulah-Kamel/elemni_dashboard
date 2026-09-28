"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getCouponsClient } from "../client"
import type { CouponInput, CouponListQuery, CouponResult } from "../schema"

export const couponKeys = {
  all: ["admin", "coupons"] as const,
  list: (query: CouponListQuery) => ["admin", "coupons", "list", query] as const,
  stats: ["admin", "coupons", "stats"] as const,
  redemptions: (code: string, page: number) => ["admin", "coupons", "redemptions", code, page] as const,
}

/** Coupon reads never retry: a missing endpoint (404/501) should surface at once. */
const noRetry = { retry: false, refetchOnWindowFocus: false } as const

export function useCouponList(query: CouponListQuery, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: couponKeys.list(query),
    queryFn: async () => (await getCouponsClient()).listCoupons(query),
    enabled,
    placeholderData: keepPreviousData,
    ...noRetry,
  })
}

export function useCouponStats() {
  return useQuery({
    queryKey: couponKeys.stats,
    queryFn: async () => (await getCouponsClient()).getCouponStats(),
    ...noRetry,
  })
}

export const REDEMPTIONS_PAGE_SIZE = 8

export function useRedemptions(code: string | null, page: number) {
  return useQuery({
    queryKey: couponKeys.redemptions(code ?? "", page),
    queryFn: async () =>
      (await getCouponsClient()).listRedemptions(code as string, {
        skip: (page - 1) * REDEMPTIONS_PAGE_SIZE,
        limit: REDEMPTIONS_PAGE_SIZE,
      }),
    enabled: code !== null,
    placeholderData: keepPreviousData,
    ...noRetry,
  })
}

export function useCouponMutations() {
  const queryClient = useQueryClient()
  const refresh = (result: CouponResult<unknown>) => {
    if (result.ok) return queryClient.invalidateQueries({ queryKey: couponKeys.all })
  }
  const create = useMutation({
    mutationFn: async (input: CouponInput) => (await getCouponsClient()).createCoupon(input),
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: async ({ code, input }: { code: string; input: CouponInput }) => (await getCouponsClient()).updateCoupon(code, input),
    onSuccess: refresh,
  })
  const toggle = useMutation({
    mutationFn: async (code: string) => (await getCouponsClient()).toggleCoupon(code),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: async (code: string) => (await getCouponsClient()).deleteCoupon(code),
    onSuccess: refresh,
  })
  return { create, update, toggle, remove }
}
