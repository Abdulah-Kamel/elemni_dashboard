import { test, expect } from "@playwright/test";

test.describe("US3 — Locale toggle + sign-out", () => {
  test("toggle locale AR → EN → AR", async ({ page }) => {
    await page.goto("/ar/(teacher)/dashboard");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: /English/i }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("button", { name: /العربية/i }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("sign-out ends session", async ({ page }) => {
    await page.goto("/ar/(teacher)/dashboard");
    await page.locator("summary").click();
    const signOutButton = page.getByRole("button", { name: /تسجيل الخروج|Sign Out/i });
    await signOutButton.click();
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
  });
});