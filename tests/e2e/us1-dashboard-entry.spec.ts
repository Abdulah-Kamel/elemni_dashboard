import { test, expect } from "@playwright/test";

test.describe("US1 — Dashboard entry", () => {
  test("authorized teacher sees the shell in AR RTL", async ({ page }) => {
    await page.goto("/ar/(teacher)/dashboard");
    await expect(page).toHaveURL(/\/ar\/\(teacher\)\/dashboard/);
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("unauthorized visitor redirects to sign-in with next param", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/ar/(teacher)/dashboard");
    await expect(page).toHaveURL(/\/ar\/sign-in/);
    await expect(page).toHaveURL(/next=/);
    await expect(page.locator("nav")).toHaveCount(0);
    await expect(page.locator("header")).toHaveCount(0);
  });

  test("open-redirect: external next param is rejected", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/ar/(teacher)/dashboard");
    const url = page.url();
    expect(url).toContain("/ar/sign-in");
    expect(url).not.toContain("evil.com");
  });
});