import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/opt/cursor/artifacts/screenshots";
mkdirSync(OUT, { recursive: true });

const accounts = [
  { email: "boss@suii.app", password: "boss123", name: "boss-dashboard" },
  { email: "hr@suii.app", password: "hr123", name: "hr-dashboard" },
  { email: "aisha@suii.app", password: "employee123", name: "employee-dashboard" },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: true });

for (const account of accounts) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').waitFor({ timeout: 10000 });
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${account.name}.png`, fullPage: true });
}

await browser.close();
console.log("Screenshots saved to", OUT);
