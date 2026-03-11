// apps/web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * ✅ 보호가 필요한 prefix들
 * - /toefl, /lingox는 "정확히 그 경로"만 public entry로 두고
 *   그 아래(/toefl/*, /lingox/*)는 protected로 처리한다.
 */
const PROTECTED_PREFIXES = [
  "/home",
  "/learn",
  "/dashboard",
  "/admin",

  // existing app routes (likely behind auth)
  "/reading",
  "/listening",
  "/speaking",
  "/writing",
  "/vocab",

  // product roots (subpaths protected; exact entry is public)
  "/toefl",
  "/lingox",
] as const;

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/auth/update-password",
  "/auth/update-password/callback",
];

const PUBLIC_FILE = /\.(.*)$/;
const DEV_ALLOW = process.env.NEXT_PUBLIC_LEGACY_ALLOW === "1";

// --- copy cookies from one response to another ---
function applySupabaseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

function normalizePath(raw?: string | null) {
  let s = (typeof raw === "string" ? raw : "") || "";
  try {
    s = decodeURIComponent(s);
  } catch {}
  s = s.trim();
  if (!s || s.includes("://")) return "/home";
  if (!s.startsWith("/")) s = `/${s}`;
  const groupHead = /^\/\([^/]+\)(?=\/|$)/;
  while (groupHead.test(s)) {
    s = s.replace(groupHead, "");
    if (!s) break;
  }
  if (s === "" || s === "/" || s.startsWith("/auth")) return "/home";
  return s;
}

function isPublicProductEntry(pathname: string) {
  // ✅ These two entry pages must stay public
  return pathname === "/toefl" || pathname === "/lingox";
}

function isProtected(pathname: string) {
  // ✅ keep product entry public
  if (isPublicProductEntry(pathname)) return false;

  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, search } = url;

  if (
    DEV_ALLOW &&
    (pathname.startsWith("/teacher") || pathname.startsWith("/legacy"))
  ) {
    return NextResponse.next();
  }

  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets/")
  ) {
    return NextResponse.next();
  }

  // create a base response for supabase cookie updates
  const baseRes = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          try {
            baseRes.cookies.set({ name, value, ...options });
          } catch {}
        },
        remove: (name: string, options: any) => {
          try {
            baseRes.cookies.set({ name, value: "", ...options, maxAge: 0 });
          } catch {}
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;

  // not authed + protected → redirect to login (carry cookies!)
  if (isProtected(pathname) && !isAuthed) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const redirectRes = NextResponse.redirect(loginUrl, 307);
    return applySupabaseCookies(baseRes, redirectRes);
  }

  // authed + /auth/* → redirect to next (carry cookies!)
  if (isAuthRoute(pathname) && isAuthed) {
    const nextRaw = url.searchParams.get("next");
    const safeTarget = normalizePath(nextRaw ?? "/home");
    const redirectRes = NextResponse.redirect(new URL(safeTarget, req.url), 307);
    return applySupabaseCookies(baseRes, redirectRes);
  }

  // normal pass-through, with possibly refreshed cookies
  return baseRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|teacher/|legacy/).*)",
  ],
};