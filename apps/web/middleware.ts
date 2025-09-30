// apps/web/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/learn', '/dashboard', '/admin'] as const
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/update-password']
const PUBLIC_FILE = /\.(.*)$/
const DEV_ALLOW = process.env.NEXT_PUBLIC_LEGACY_ALLOW === '1'

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const url = req.nextUrl

  // ??dev?먯꽌 teacher/legacy???꾩쟾 ?⑥뒪
  if (DEV_ALLOW && (pathname.startsWith('/teacher') || pathname.startsWith('/legacy'))) {
    return NextResponse.next()
  }

  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isAuthed =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb-refresh-token') ||
    req.cookies.has('supabase-auth-token')

  if (isProtected(pathname) && !isAuthed) {
    const loginUrl = url.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute(pathname) && isAuthed) {
    const nextTarget = url.searchParams.get('next') || '/learn/toefl/dashboard'
    return NextResponse.redirect(new URL(nextTarget, req.url))
  }

  return NextResponse.next()
}

export const config = {
  // ??teacher/legacy瑜??꾩삁 留ㅼ쿂?먯꽌 鍮쇰룄 醫뗭쓬 (??以??섎굹留??대룄 ??
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|teacher/|legacy/).*)'],
}

