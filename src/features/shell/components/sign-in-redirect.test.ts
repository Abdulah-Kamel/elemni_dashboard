import { describe, it, expect } from "vitest";
import { validateNextParam } from "@/features/shell/components/sign-in-redirect";

describe("next param validation (FR-002 — no open-redirect)", () => {
  const locale = "ar";

  it("rejects https://evil.com", () => {
    expect(validateNextParam("https://evil.com", locale)).toBe(`/${locale}/dashboard`);
  });

  it("rejects //evil.com", () => {
    expect(validateNextParam("//evil.com", locale)).toBe(`/${locale}/dashboard`);
  });

  it("rejects javascript: URIs", () => {
    expect(validateNextParam("javascript:alert(1)", locale)).toBe(`/${locale}/dashboard`);
  });

  it("rejects http:// URLs", () => {
    expect(validateNextParam("http://evil.com", locale)).toBe(`/${locale}/dashboard`);
  });

  it("accepts /ar/billing", () => {
    expect(validateNextParam("/ar/billing", locale)).toBe("/ar/billing");
  });

  it("accepts /en/dashboard", () => {
    expect(validateNextParam("/en/dashboard", locale)).toBe("/en/dashboard");
  });

  it("defaults to dashboard when next is missing", () => {
    expect(validateNextParam(undefined, locale)).toBe(`/${locale}/dashboard`);
  });
});