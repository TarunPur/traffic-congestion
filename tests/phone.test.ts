import { describe, it, expect } from "vitest";
import { digitsOnly, formatNationalMobile, isValidMobile, toE164 } from "@/lib/phone";

describe("phone helpers (screen 01)", () => {
  it("strips non-digits and caps at 10", () => {
    expect(digitsOnly("98a24 0177 22 999")).toBe("9824017722");
    expect(digitsOnly("+91 98240")).toBe("9198240".slice(0, 10)); // keeps digit stream, capped
  });

  it("formats as 98xxx xxxxx once past 5 digits", () => {
    expect(formatNationalMobile("98240")).toBe("98240");
    expect(formatNationalMobile("9824017722")).toBe("98240 17722");
    expect(formatNationalMobile("98240177229999")).toBe("98240 17722");
  });

  it("is valid only at exactly 10 digits", () => {
    expect(isValidMobile("98240 1772")).toBe(false);
    expect(isValidMobile("98240 17722")).toBe(true);
    expect(isValidMobile("982401772299")).toBe(true); // capped to 10 → valid
  });

  it("builds E.164 with +91", () => {
    expect(toE164("98240 17722")).toBe("+919824017722");
  });
});
