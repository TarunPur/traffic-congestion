import { test, expect } from "@playwright/test";

/**
 * End-to-end walkthrough of both journeys (P11.6, per journey.md §3 navigation map).
 * Prereq: local Supabase up (`supabase start`) + a clean `supabase db reset`. Playwright's
 * webServer starts the dev server; the `setup` project (auth.setup.ts) logs in once and the
 * tests below reuse that session via `storageState` (playwright.config.ts).
 *
 * Note on the built flow: after OTP verify the app lands on `/` (home), not `/choose`
 * (verify/page.tsx → router.push("/")), so each test navigates to its own start screen.
 */

test.describe("Journey 1 — plan a trip and save the commute", () => {
  test("choose → from → to → ways → save → home", async ({ page }) => {
    await page.goto("/choose");

    await expect(page.getByRole("radio", { name: /plan it myself/i })).toBeChecked();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL("**/from");

    await page.getByLabel("Search start").fill("Hauz Khas");
    await page.getByRole("option", { name: /Hauz Khas Enclave/ }).first().click();
    await page.getByRole("button", { name: /set as start/i }).click();
    await page.waitForURL("**/to");

    await page.getByLabel("Search destination").fill("DLF Cyber");
    await page.getByRole("option", { name: /DLF Cyber/ }).first().click();
    await page.getByRole("button", { name: /set as destination/i }).click();

    await page.waitForURL(/\/(ways|part)/);
    if (page.url().includes("/part")) {
      await page.getByRole("button", { name: /continue/i }).click();
      await page.waitForURL("**/ways");
    }

    await expect(page.getByText(/Recommended/).first()).toBeVisible();
    await page.getByRole("button", { name: /set as my commute/i }).click();
    await page.waitForURL((u) => u.pathname === "/");
    await expect(page.getByText(/Leave by/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "true");
  });

  test("More section is reachable from You", async ({ page }) => {
    await page.goto("/you");
    for (const [label, path] of [
      ["Profile", "/profile"],
      ["Support", "/support"],
      ["Privacy & data", "/privacy"],
      ["About Clearline", "/about"],
    ] as const) {
      await page.getByRole("button", { name: new RegExp(label) }).first().click();
      await page.waitForURL(`**${path}`);
      await page.goBack();
      await page.waitForURL("**/you");
    }
  });
});

test.describe("Journey 2 — managed commute (waitlist path)", () => {
  test("choose managed → eligibility (personal domain) → corridor → commit", async ({ page }) => {
    await page.goto("/choose");

    await page.getByRole("radio", { name: /Clearline manages it/i }).click();
    await page.getByRole("button", { name: /join the waitlist/i }).click();
    await page.waitForURL("**/eligibility");

    await page.getByLabel("Work email").fill("someone@gmail.com");
    await page.getByRole("button", { name: /check my workplace/i }).click();
    await page.waitForURL("**/corridor", { timeout: 15_000 });

    await expect(page.getByText(/\/ 250 committed/)).toBeVisible();
    await page.getByRole("button", { name: "Commit my seat" }).click();
    await expect(page.getByRole("button", { name: /on the waitlist/i })).toBeVisible();
  });

  test("no money anywhere in J2 — the booking screen says ₹0 · pilot", async ({ page }) => {
    // A partnered domain would land here from 17a; drive straight in.
    await page.goto("/setup");
    await page.getByLabel("Home area").fill("Hauz Khas Enclave");
    await page.getByLabel("Tower").fill("DLF Cyber City, Bldg 10");
    await page.getByRole("button", { name: /generate my plan/i }).click();
    await page.waitForURL("**/itinerary", { timeout: 15_000 });

    await expect(page.getByText(/committed window/i).first()).toBeVisible();
    await page.getByRole("button", { name: /accept & save this commute/i }).click();
    await page.waitForURL("**/booking");

    await expect(page.getByText("₹0 · pilot")).toBeVisible();
    await page.getByRole("button", { name: /confirm commute/i }).click();
    await page.waitForURL("**/managed", { timeout: 15_000 });
    await expect(page.getByText(/Be ready by/i)).toBeVisible();
  });
});
