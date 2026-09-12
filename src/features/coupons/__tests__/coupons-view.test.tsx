// src/features/coupons/__tests__/coupons-view.test.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CouponsView } from "../components/coupons-view";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "ar" }));

describe("CouponsView", () => {
  it("renders SAVE20 row", () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><CouponsView onCreate={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} /></QueryClientProvider>);
    expect(screen.getByText("SAVE20")).toBeDefined();
  });
});
