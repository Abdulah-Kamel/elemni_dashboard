import { test, expect } from "@playwright/test";

test.describe("US2 — Shell navigation", () => {
  test("walk all five destinations without leaving the layout", async ({ page }) => {
    await page.goto("/ar/(teacher)/dashboard");
    await expect(page.locator("nav")).toBeVisible();

    for (const dest of ["lessons", "students", "analytics", "billing", "dashboard"]) {
      await page.goto(`/ar/(teacher)/${dest}`);
      await expect(page.locator("nav")).toBeVisible();
      await expect(page.locator("[data-testid='content'], main")).toBeVisible();
    }
  });

  test("lessons placeholder shows course count", async ({ page }) => {
    await page.goto("/ar/(teacher)/lessons");
    await expect(page.locator("main")).toContainText(/دورة|course/i);
  });

  test("students placeholder shows static empty state", async ({ page }) => {
    await page.goto("/ar/(teacher)/students");
    await expect(page.locator("main")).toContainText(/شاشة|screen/i);
  });
});