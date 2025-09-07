import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 보호할 경로들
const PROTECTED_PREFIXES = ['/learn', '/dashboard', '/admin'] as const

// 인증/공개 경로 (절대 리다이렉트 금지)
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/update-password']

// 정적 파일 패턴 (이미지, 폰트, 아이콘 등)
const PUBLIC_FILE = /\.(.*)$/

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const url = req.nextUrl

  // 1) 완전 무시해야 하는 것들: 정적 파일, _next, api, 파비콘
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2) 인증 여부 판단 (Supabase 기본 쿠키들)
  const isAuthed =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb-refresh-token') ||
    req.cookies.has('supabase-auth-token') // 환경에 따라 존재할 수도

  // 3) 보호 경로 접근인데 미인증이면 → 로그인으로
  if (isProtected(pathname) && !isAuthed) {
    const loginUrl = url.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // 4) 이미 로그인인데 로그인/회원가입 페이지로 가면 → 대시보드로
  if (isAuthRoute(pathname) && isAuthed) {
    const nextTarget = url.searchParams.get('next') || '/learn/toefl/dashboard'
    return NextResponse.redirect(new URL(nextTarget, req.url))
  }

  return NextResponse.next()
}

// 이 매처는 대부분 경로를 훑되, 위 가드들이 안전하게 걸러줌
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
}
