// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/home', '/learn', '/dashboard', '/admin'] as const;
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/update-password',
  '/auth/update-password/callback',
];
const PUBLIC_FILE = /\.(.*)$/; // e.g. /images/a.png
const DEV_ALLOW = process.env.NEXT_PUBLIC_LEGACY_ALLOW === '1';

/**
 * Normalize a path that may include route groups like /(protected),
 * absolute URLs, or /auth/*. Returns a safe app path (defaults to /home).
 */
function normalizePath(raw?: string | null) {
  let s = (typeof raw === 'string' ? raw : '') || '';
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore decode errors
  }
  s = s.trim();

  // reject empty or absolute urls
  if (!s || s.includes('://')) return '/home';

  // ensure leading slash
  if (!s.startsWith('/')) s = `/${s}`;

  // strip route groups like /(protected)
  const groupHead = /^\/\([^/]+\)(?=\/|$)/;
  while (groupHead.test(s)) {
    s = s.replace(groupHead, '');
    if (!s) break;
  }

  // redirect / and /auth* to /home
  if (s === '' || s === '/' || s.startsWith('/auth')) return '/home';
  return s;
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, search } = url;

  // Allow teacher/legacy pages when explicitly enabled
  if (DEV_ALLOW && (pathname.startsWith('/teacher') || pathname.startsWith('/legacy'))) {
    return NextResponse.next();
  }

  // Public/static resources pass through
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/assets/')
  ) {
    return NextResponse.next();
  }

  // IMPORTANT: create a response upfront so supabase cookie set/remove can attach to it
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            res.cookies.set({ name, value, ...options });
          } catch {
            // ignore
          }
        },
        remove(name: string, options: any) {
          try {
            // NextResponse has delete, but maxAge:0 with set is also fine
            res.cookies.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            // ignore
          }
        },
      },
    }
  );

  // Check current session (do not rely on cookie names directly)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;

  // If protected route and not authed -> redirect to login with ?next
  if (isProtected(pathname) && !isAuthed) {
    const loginUrl = url.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // If authed and visiting /auth/* -> redirect to next (or /home)
  if (isAuthRoute(pathname) && isAuthed) {
    const nextRaw = url.searchParams.get('next');
    const safeTarget = normalizePath(nextRaw ?? '/home');
    return NextResponse.redirect(new URL(safeTarget, req.url));
  }

  // Default pass-through (with any cookie updates attached to res)
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|teacher/|legacy/).*)'],
};




