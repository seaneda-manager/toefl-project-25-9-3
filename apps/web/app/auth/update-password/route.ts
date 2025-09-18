import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?m=missing-code', url))
  }
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  const next = error
    ? `/auth/login?m=reset-error&err=${encodeURIComponent(error.message)}`
    : '/auth/update-password'
  return NextResponse.redirect(new URL(next, url))
}
