import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LOCALE = "ar";
const DOWNLOADS_DIR = join(process.env.HOME, "Downloads", "dashboards");

const USERS = [
  {
    role: "admin",
    email: "admin@test.com",
    password: "admin123",
    pages: [
      { name: "admin-overview", path: "/admin" },
      { name: "admin-teachers", path: "/admin/teachers" },
      { name: "admin-students", path: "/admin/students" },
      { name: "admin-subscriptions", path: "/admin/subscriptions" },
      { name: "admin-grades", path: "/admin/grades" },
      { name: "admin-streams", path: "/admin/streams" },
      { name: "admin-subjects", path: "/admin/subjects" },
    ],
  },
  {
    role: "teacher",
    email: "ahmed-hassan@test.com",
    password: "teacher123",
    pages: [
      { name: "dashboard", path: "/dashboard" },
      { name: "courses", path: "/courses" },
      { name: "students", path: "/students" },
      { name: "storage", path: "/storage" },
      { name: "settings", path: "/settings" },
      { name: "profile", path: "/profile" },
      { name: "billing", path: "/billing" },
      { name: "lessons", path: "/lessons" },
    ],
  },
];

async function login(page, email, password) {
  const signInUrl = `${BASE_URL}/${LOCALE}/sign-in`;
  console.log(`  Navigating to ${signInUrl}`);
  await page.goto(signInUrl, { waitUntil: "networkidle2", timeout: 30000 });

  await page.waitForSelector("#sign-in-email", { timeout: 10000 });
  await page.type("#sign-in-email", email, { delay: 30 });

  await page.waitForSelector("#sign-in-password", { timeout: 5000 });
  await page.type("#sign-in-password", password, { delay: 30 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('form button[type="submit"]'),
  ]);

  console.log(`  Logged in as ${email} → now at ${page.url()}`);
}

async function forceLightMode(page) {
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem("theme", "light");
  });
}

async function screenshotPage(page, roleDir, pageConfig) {
  const url = `${BASE_URL}/${LOCALE}${pageConfig.path}`;
  console.log(`  Screenshotting ${pageConfig.name} → ${url}`);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  // Wait for sidebar/content to settle
  await new Promise((r) => setTimeout(r, 2000));

  const filePath = join(roleDir, `${pageConfig.name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Saved: ${filePath}`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const user of USERS) {
    const roleDir = join(DOWNLOADS_DIR, user.role);
    await mkdir(roleDir, { recursive: true });

    console.log(`\n=== ${user.role.toUpperCase()} ===`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await login(page, user.email, user.password);
      await forceLightMode(page);

      for (const pageConfig of user.pages) {
        await screenshotPage(page, roleDir, pageConfig);
      }
    } catch (err) {
      console.error(`  ERROR for ${user.role}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${DOWNLOADS_DIR}`);
}

main();
