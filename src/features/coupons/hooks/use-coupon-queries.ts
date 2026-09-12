// src/features/coupons/hooks/use-coupon-queries.ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminKeys } from "@/features/admin/query-keys";
import { deriveStatus } from "../store";
import { createCoupon, deleteCoupon, listCoupons, toggleCoupon, updateCoupon } from "../store";

export function useCoupons(search: string, status: string, type: string) {
  return useQuery({
    queryKey: adminKeys.coupons({ search, status, type }),
    queryFn: () => {
      const q = search.trim().toUpperCase();
      return listCoupons().filter((c) => {
        if (q && !c.code.includes(q)) return false;
        if (type !== "all" && c.type !== type) return false;
        if (status !== "all" && deriveStatus(c) !== status) return false;
        return true;
      });
    },
  });
}
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: adminKeys.coupons() });
}
export function useCreateCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (input: unknown) => createCoupon(input),
    onSuccess: () => { inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ code, patch }: { code: string; patch: unknown }) => updateCoupon(code, patch),
    onSuccess: () => { inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (code: string) => { deleteCoupon(code); return code; },
    onSuccess: () => { inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useToggleCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (code: string) => toggleCoupon(code),
    onSuccess: () => { inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
