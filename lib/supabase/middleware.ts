import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv, hasSupabaseCredentials } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every request and enforces route protection
 * (ERD §4). Unauthenticated users hitting a protected route are redirected to /login.
 * Public routes: /login, /verify, /api/*, /dev/*, and framework/static assets.
 */

const PUBLIC_PATHS = ["/login", "/verify"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/dev/")) return true; // dev galleries (not shipped)
  return false;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Without credentials (never in normal dev now, but safe) don't attempt auth — just pass through.
  if (!hasSupabaseCredentials()) return response;

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() revalidates the token with the auth server (do not trust getSession alone here).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on the auth screens.
  if (user && (pathname === "/login" || pathname === "/verify")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
