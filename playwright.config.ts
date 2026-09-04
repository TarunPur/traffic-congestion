import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e (P11.6, per journey.md). Runs the two full journeys against a local dev server
 * with local Supabase up. NOT wired into CI yet — needs `pnpm add -D @playwright/test` +
 * `pnpm exec playwright install chromium` (a dependency add — pending Tarun's approval, see
 * PARKED). Test login: phone 98123 45678, OTP 424242 (supabase/config.toml test_otp).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 390, height: 844 }, // iPhone 14-ish — the app is mobile-only
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
