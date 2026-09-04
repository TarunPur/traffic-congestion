import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end walkthrough of both journeys (P11.6, per journey.md §3 navigation map).
 * Prereq: local Supabase up (`supabase start`), `supabase db reset` for a clean DB, and
 * `pnpm dev`. Test login: phone 98123 45678, OTP 424242.
 *
 * Run: `pnpm exec playwright test` (after `pnpm add -D @playwright/test &&
 * pnpm exec playwright install chromium` — pending approval, see PARKED).
 */

const PHONE = "9812345678";
const OTP = "424242";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/mobile/i).fill(PHONE);
  await page.getByRole("button", { name: /continue|send/i }).click();
  await page.getByRole("textbox").first().waitFor();
  // OTP is 6 single-digit cells — type the string; auto-advance fills them.
  for (const [i, d] of [...OTP].entries()) {
    await page.getByRole("textbox").nth(i).fill(d);
  }
  await page.getByRole("button", { name: /verify/i }).click();
  await page.waitForURL("**/choose");
}

test.describe("Journey 1 — plan a trip and save the commute", () => {
  test("login → choose → from → to → ways → plan → save → home", async ({ page }) => {
    await login(page);

    await expect(page.getByRole("radio", { name: /plan it myself/i })).toBeChecked();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/from");

    await page.getByLabel(/where from|from/i).first().fill("Hauz Khas");
    await page.getByRole("option", { name: /Hauz Khas Enclave/ }).first().click();
    await page.getByRole("button", { name: /set as start/i }).click();
    await page.waitForURL("**/to");

    await page.getByLabel(/where to|destination|to/i).first().fill("DLF Cyber");
    await page.getByRole("option", { name: /DLF Cyber/ }).first().click();
    await page.getByRole("button", { name: /set as destination/i }).click();

    await page.waitForURL(/\/(ways|part)/);
    if (page.url().includes("/part")) {
      await page.getByRole("button", { name: /continue/i }).click();
      await page.waitForURL("**/ways");
    }

    await expect(page.getByText(/Recommended/)).toBeVisible();
    await page.getByRole("button", { name: /set as my commute/i }).click();
    await page.waitForURL("**/");
    await expect(page.getByText(/Leave by/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Home/ })).toHaveAttribute("aria-current", "true");
  });

  test("More section is reachable from You", async ({ page }) => {
    await login(page);
    await page.goto("/you");
    for (const [label, path] of [
      ["Profile", "/profile"],
      ["Support", "/support"],
      ["Privacy & data", "/privacy"],
      ["About Clearline", "/about"],
    ] as const) {
      await page.getByRole("button", { name: new RegExp(label) }).click();
      await page.waitForURL(`**${path}`);
      await page.goBack();
    }
  });
});

test.describe("Journey 2 — managed commute (waitlist path)", () => {
  test("choose managed → eligibility (personal domain) → corridor → commit", async ({ page }) => {
    await login(page);
    await page.getByRole("radio", { name: /Clearline manages it/i }).click();
    await page.getByRole("button", { name: /join the waitlist/i }).click();
    await page.waitForURL("**/eligibility");

    await page.getByLabel("Work email").fill("someone@gmail.com");
    await page.getByRole("button", { name: /check my workplace/i }).click();
    await page.waitForURL("**/corridor");

    await expect(page.getByText(/\/ 250 committed/)).toBeVisible();
    await page.getByRole("button", { name: "Commit my seat" }).click();
    await expect(page.getByRole("button", { name: /on the waitlist/i })).toBeVisible();
  });

  test("no money anywhere in J2 — the booking screen says ₹0 · pilot", async ({ page }) => {
    await login(page);
    // Drive straight to setup → itinerary → booking (a partnered domain would land here from 17a).
    await page.goto("/setup");
    await page.getByLabel("Home area").fill("Hauz Khas Enclave");
    await page.getByLabel("Tower").fill("DLF Cyber City, Bldg 10");
    await page.getByRole("button", { name: /generate my plan/i }).click();
    await page.waitForURL("**/itinerary");
    await expect(page.getByText(/committed window/i).first()).toBeVisible();
    await page.getByRole("button", { name: /accept & save this commute/i }).click();
    await page.waitForURL("**/booking");
    await expect(page.getByText("₹0 · pilot")).toBeVisible();
    await page.getByRole("button", { name: /confirm commute/i }).click();
    await page.waitForURL("**/managed");
    await expect(page.getByText(/Be ready by/i)).toBeVisible();
  });
});
