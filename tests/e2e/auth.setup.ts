import { test as setup, expect } from "@playwright/test";

/**
 * Logs in ONCE and saves the authenticated storage state. Every journey test reuses it
 * (playwright.config.ts → `storageState`), so the suite makes a single OTP send and never
 * trips Supabase Auth's SMS-frequency rate limit. Test creds: 98123 45678 / 424242
 * (supabase/config.toml [auth.sms.test_otp]).
 */

const authFile = "tests/e2e/.auth/user.json"; // relative to cwd (repo root); matches playwright.config.ts

const PHONE = "9812345678";
const OTP = "424242";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Mobile number").fill(PHONE);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/verify");

  // 6 controlled single-char cells with auto-advance; the 6th digit auto-submits → "/".
  await page.locator(".otp .cell").first().click();
  await page.keyboard.type(OTP, { delay: 80 });
  await page.waitForURL((u) => u.pathname === "/", { timeout: 15_000 });

  await expect(page.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "true");
  await page.context().storageState({ path: authFile });
});
