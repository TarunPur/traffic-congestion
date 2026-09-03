/**
 * Typed environment access (ERD §1 secrets discipline).
 *
 * `publicEnv` holds only browser-safe NEXT_PUBLIC_* values. `serverEnv()` reads server-only
 * secrets and THROWS if called where `window` exists — a runtime guard so the service-role /
 * Mappls keys can never be pulled into a client bundle. See [[reference_nextjs_client_env_vars]].
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty",
  billingEnabled: process.env.NEXT_PUBLIC_BILLING_ENABLED === "true",
} as const;

/** True when the env values are real (not the parked placeholders) — lets code degrade gracefully. */
export function hasSupabaseCredentials(): boolean {
  return (
    publicEnv.supabaseUrl.startsWith("http") &&
    publicEnv.supabaseAnonKey.length > 0 &&
    !publicEnv.supabaseAnonKey.startsWith("REPLACE_WITH")
  );
}

export interface ServerEnv {
  supabaseServiceRoleKey: string;
  mapplsClientId: string;
  mapplsClientSecret: string;
  liveFulfilmentSource: string;
}

/** Server-only secrets. Throws if reached from the browser bundle. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must never run in the browser — server-only secrets.");
  }
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    mapplsClientId: process.env.MAPPLS_CLIENT_ID ?? "",
    mapplsClientSecret: process.env.MAPPLS_CLIENT_SECRET ?? "",
    liveFulfilmentSource: process.env.LIVE_FULFILMENT_SOURCE ?? "diy",
  };
}
