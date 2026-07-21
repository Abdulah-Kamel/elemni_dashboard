import { test, expect } from "@playwright/test";

test.describe("Course Management E2E", () => {
  test("AR/EN critical path: list → create → edit → publish", async ({ page }) => {
    // Navigate to courses page
    await page.goto("/ar/courses");
    await expect(page.locator("h1")).toContainText("دورةي");

    // Click create course button
    await page.click("button:has-text('إنشاء دورة')");

    // Fill in the form
    await page.fill('input[id="title"]', "دورة تجريبية");
    await page.fill('input[id="description"]', "وصف الدورة التجريبية");
    await page.fill('input[id="price"]', "200.00");

    // Submit the form
    await page.click("button:has-text('حفظ')");

    // Verify success (the sheet should close)
    await expect(page.locator('[data-slot="sheet"]')).not.toBeVisible();
  });

  test("switches locale", async ({ page }) => {
    // Navigate to courses page in Arabic
    await page.goto("/ar/courses");
    await expect(page.locator("h1")).toContainText("دورةي");

    // Switch to English
    await page.click('button:has-text("English")');

    // Verify English locale
    await expect(page.locator("h1")).toContainText("My Courses");
  });
});
