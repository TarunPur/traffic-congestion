import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e (P11.6, per journey.md). Runs the two full journeys against a local dev server
 * with local Supabase up. Needs `pnpm add -D @playwright/test` + `pnpm exec playwright install
 * chromium`. Test login: phone 98123 45678, OTP 424242 (supabase/config.toml test_otp).
 *
 * A `setup` project logs in once and writes tests/e2e/.auth/user.json; the journey tests
 * reuse it via `storageState` so the whole run makes a single OTP send (Supabase Auth rate-
 * limits SMS frequency per number).
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
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], storageState: "tests/e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
