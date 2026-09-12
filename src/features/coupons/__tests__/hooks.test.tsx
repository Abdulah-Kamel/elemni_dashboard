// src/features/coupons/__tests__/hooks.test.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCoupons } from "../hooks/use-coupon-queries";

describe("useCoupons", () => {
  it("filters by search", async () => {
    const qc = new QueryClient();
    const { result } = renderHook(() => useCoupons("SAVE", "all", "all"), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(result.current.data?.some((c) => c.code === "SAVE20")).toBe(true));
  });
});
