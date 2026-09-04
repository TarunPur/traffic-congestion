/**
 * Indian mobile number helpers (screen 01). +91 fixed, 10 national digits.
 * Formatting ported from 01-login.html: "98xxx xxxxx". Pure + testable.
 */

/** Strip non-digits, cap at 10. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

/** Display format: first 5 digits, a space, then the rest ("98xxx xxxxx"). */
export function formatNationalMobile(input: string): string {
  const v = digitsOnly(input);
  return v.length > 5 ? `${v.slice(0, 5)} ${v.slice(5)}` : v;
}

/** Valid when exactly 10 national digits. */
export function isValidMobile(input: string): boolean {
  return digitsOnly(input).length === 10;
}

/** E.164 for Supabase signInWithOtp({ phone }). Assumes a validated 10-digit input. */
export function toE164(input: string): string {
  return `+91${digitsOnly(input)}`;
}
