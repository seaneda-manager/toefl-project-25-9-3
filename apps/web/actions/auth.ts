/* apps/web/actions/auth.ts */
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type ActionState = {
  ok: boolean;
  error: string | null;
  redirectTo?: string;
};
export type Session = import('@supabase/supabase-js').Session;

/* ?占?占?占?占?占?占?占?占?占?Env & URL helpers ?占?占?占?占?占?占?占?占?占?*/

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

/** 諛고룷 ?占쎄꼍??留욌뒗 public site URL???占쎌텧 (https 湲곕낯) */
function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SUPABASE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const base = (fromEnv || 'http://localhost:3000').replace(/\/$/, '');
  try {
    // ?占쏀슚??URL占??占쎌슜
    const u = new URL(base);
    return u.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

/** ?占쎌슦??洹몃９ ?占쎄굅 + ?占쏙옙? URL 李⑤떒 + ?占쎌쟾 寃쎈줈 蹂댁젙 */
function normalizePublicPath(raw?: string | null) {
  let s = (typeof raw === 'string' ? raw : '') || '';
  try { s = decodeURIComponent(s); } catch {}
  s = s.trim();

  // ?占쏙옙? URL/?占쏀궡 李⑤떒
  if (!s || /^[a-z]+:\/\//i.test(s)) return '/home';

  // 諛섎뱶???占쎈옒???占쎌옉
  if (!s.startsWith('/')) s = `/${s}`;

  // /(group) ?占쎈몢 諛섎났 ?占쎄굅
  const groupHead = /^\/\([^/]+\)(?=\/|$)/;
  while (groupHead.test(s)) {
    s = s.replace(groupHead, '') || '/';
  }

  // auth 猷⑦봽占??占쎌뼱媛占??占쎌쑝占?
  if (s === '/' || s.startsWith('/auth')) return '/home';
  return s;
}

/* ?占?占?占?占?占?占?占?占?占?Supabase server client (server actions/route handlers) ?占?占?占?占?占?占?占?占?占?*/

export async function getSupabaseActionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    assertEnv('NEXT_PUBLIC_SUPABASE_URL'),
    assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); } catch {}
        },
      },
    }
  );
}

/* ?占?占?占?占?占?占?占?占?占?Actions ?占?占?占?占?占?占?占?占?占?*/

export async function getSession(): Promise<Session | null> {
  const supabase = await getSupabaseActionClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

/** Email/Password 濡쒓렇??(?占쎄났 ??利됱떆 redirect) */
export async function signInWithPassword(
  formDataOrCreds: FormData | { email: string; password: string }
): Promise<ActionState> {
  const email =
    typeof formDataOrCreds === 'object' && 'email' in formDataOrCreds
      ? formDataOrCreds.email
      : String((formDataOrCreds as FormData).get('email') ?? '').trim();

  const password =
    typeof formDataOrCreds === 'object' && 'password' in formDataOrCreds
      ? formDataOrCreds.password
      : String((formDataOrCreds as FormData).get('password') ?? '');

  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };

  const nextRaw =
    (formDataOrCreds instanceof FormData ? (formDataOrCreds.get('next') as string | null) : null) ?? '/home';
  const next = normalizePublicPath(nextRaw);
  redirect(next); // ??諛섑솚?占쏙옙? ?占쎌쓬
}

/** 鍮꾬옙?踰덊샇 ?占쎌꽕??硫붿씪 ?占쎌넚 */
export async function sendReset(formDataOrEmail: FormData | string): Promise<ActionState> {
  const email =
    typeof formDataOrEmail === 'string'
      ? formDataOrEmail
      : String(formDataOrEmail.get('email') ?? '').trim();

  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/update-password/callback`,
  });
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };

  return {
    ok: true,
    error: null,
    redirectTo: `/auth/login?m=reset-sent&email=${encodeURIComponent(email)}`,
  };
}

/** ??鍮꾬옙?踰덊샇 ?占쎌젙 */
export async function updatePassword(formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '');
  if (!password || password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null, redirectTo: '/auth/login?m=password-updated' };
}

/** /auth/callback: 肄붾뱶占??占쎌뀡 援먰솚 */
export async function exchangeCodeForSession(authCode: string): Promise<ActionState> {
  if (!authCode) return { ok: false, error: 'Missing auth code.' };
  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null };
}

/** ?占쎌썝媛??怨듯넻) */
export async function signUp(
  formData: FormData | { email: string; password: string; role?: string }
): Promise<ActionState> {
  const email =
    typeof formData === 'object' && 'email' in formData
      ? formData.email
      : String((formData as FormData).get('email') ?? '').trim();

  const password =
    typeof formData === 'object' && 'password' in formData
      ? formData.password
      : String((formData as FormData).get('password') ?? '');

  const role =
    typeof formData === 'object' && 'role' in formData
      ? (formData as any).role
      : (String((formData as FormData).get('role') ?? '') || undefined);

  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: role ? { role } : undefined },
  });
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null };
}

/** 援먯궗 ?占쎌썝媛??(role=teacher 怨좎젙) */
export async function signUpTeacher(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { ok: false, error: 'Email and password are required.' };
  return await signUp({ email, password, role: 'teacher' });
}

/** 濡쒓렇?占쎌썐 */
export async function signOut(): Promise<ActionState> {
  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null, redirectTo: '/auth/login' };
}

/** ???占쎌뀡??利됱떆 由щ떎?占쎈젆??*/
export async function signOutAction(_: FormData) {
  const res = await signOut();
  redirect(res.redirectTo ?? '/auth/login');
}

/* ---- ?占쏀솚 蹂꾩묶 (湲곗〈 肄붾뱶 蹂댄샇) ---- */
export async function signInEmailPassword(formData: FormData) {
  return signInWithPassword(formData);
}
export const signInWithPasswordAction = signInWithPassword;

/* ?占?占?占?占?占?占?占?占?占?misc ?占?占?占?占?占?占?占?占?占?*/

function sanitizeAuthError(msg?: string | null) {
  const s = (msg || '').toLowerCase();
  if (!s) return 'Authentication failed.';
  // ?占쎈Т ?占쏙옙??占쎌씤 硫붿떆吏???占쏀솕
  if (s.includes('invalid login credentials')) return 'Invalid email or password.';
  if (s.includes('email not confirmed')) return 'Please confirm your email.';
  return msg || 'Authentication failed.';
}




