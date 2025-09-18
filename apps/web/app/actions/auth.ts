'use server'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabaseServer'

export type ActionState = { ok: boolean; error: string | null; redirectTo?: string }

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
}

/** Email/Password 濡쒓렇??*/
export async function signInEmailPassword(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

/** 鍮꾨?踰덊샇 ?ъ꽕??硫붿씪 諛쒖넚 */
export async function sendReset(formDataOrEmail: FormData | string): Promise<ActionState> {
  const email = typeof formDataOrEmail === 'string' ? formDataOrEmail : String(formDataOrEmail.get('email') ?? '')
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/auth/reset-finish` })
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null, redirectTo: `/auth/login?m=reset-sent&email=${encodeURIComponent(email)}` }
}

/** ??鍮꾨?踰덊샇 ???*/
export async function updatePassword(formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '')
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null, redirectTo: '/auth/reset-finish' }
}

/** /auth/callback 肄붾뱶?믪꽭??援먰솚 */
export async function exchangeCodeForSession(authCode: string): Promise<ActionState> {
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(authCode)
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

/** ?뚯썝媛???꾩슂 ?? */
export async function signUp(formData: FormData | { email: string; password: string; role?: string }): Promise<ActionState> {
  const email = typeof formData === 'object' && 'email' in formData ? formData.email : String((formData as FormData).get('email') ?? '')
  const password = typeof formData === 'object' && 'password' in formData ? formData.password : String((formData as FormData).get('password') ?? '')
  const role = typeof formData === 'object' && 'role' in formData ? (formData.role as string | undefined) : (String((formData as FormData).get('role') ?? '') || undefined)
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: role ? { role } : undefined }
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

/** 濡쒓렇?꾩썐 + ?쒕쾭由щ떎?대젆?몄슜 ?≪뀡 */
export async function signOut(): Promise<ActionState> {
  const supabase = getSupabaseServer()
  const { error } = await supabase.auth.signOut()
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null, redirectTo: '/auth/login' }
}

export async function signOutAction(_: FormData) {
  const res = await signOut()
  redirect(res.redirectTo ?? '/auth/login')
}
