import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Server Supabase client bound to the request cookies (SSR session). Use in Server Components,
 * Route Handlers and Server Actions. Anon key + RLS — this is the user-scoped client.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only — the middleware
          // refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client — BYPASSES RLS. Server-only, for the narrow set of privileged writes
 * (eligibility.partnered, committed_count, demand_signals aggregation). Never expose to a user
 * request path without an explicit server-side authorization check. Throws in the browser.
 */
export function createServiceRoleClient() {
  const { supabaseServiceRoleKey } = serverEnv();
  return createServerClient<Database>(publicEnv.supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* no session for the service-role client */
      },
    },
  });
}
