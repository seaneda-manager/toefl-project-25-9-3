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

/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä Env & URL helpers ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

/** Î∞∞Ìè¨ ?òÍ≤Ω??ÎßûÎäî public site URL???∞Ï∂ú (https Í∏∞Î≥∏) */
function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SUPABASE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const base = (fromEnv || 'http://localhost:3000').replace(/\/$/, '');
  try {
    // ?†Ìö®??URLÎß??àÏö©
    const u = new URL(base);
    return u.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

/** ?ºÏö∞??Í∑∏Î£π ?úÍ±∞ + ?∏Î? URL Ï∞®Îã® + ?àÏ†Ñ Í≤ΩÎ°ú Î≥¥Ï†ï */
function normalizePublicPath(raw?: string | null) {
  let s = (typeof raw === 'string' ? raw : '') || '';
  try { s = decodeURIComponent(s); } catch {}
  s = s.trim();

  // ?∏Î? URL/?§ÌÇ¥ Ï∞®Îã®
  if (!s || /^[a-z]+:\/\//i.test(s)) return '/home';

  // Î∞òÎìú???¨Îûò???úÏûë
  if (!s.startsWith('/')) s = `/${s}`;

  // /(group) ?ëÎëê Î∞òÎ≥µ ?úÍ±∞
  const groupHead = /^\/\([^/]+\)(?=\/|$)/;
  while (groupHead.test(s)) {
    s = s.replace(groupHead, '') || '/';
  }

  // auth Î£®ÌîÑÎ°??§Ïñ¥Í∞ÄÎ©??àÏúºÎ°?
  if (s === '/' || s.startsWith('/auth')) return '/home';
  return s;
}

/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä Supabase server client (server actions/route handlers) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */

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

/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä Actions ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */

export async function getSession(): Promise<Session | null> {
  const supabase = await getSupabaseActionClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

/** Email/Password Î°úÍ∑∏??(?±Í≥µ ??Ï¶âÏãú redirect) */
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
  redirect(next); // ??Î∞òÌôò?òÏ? ?äÏùå
}

/** ÎπÑÎ?Î≤àÌò∏ ?¨ÏÑ§??Î©îÏùº ?ÑÏÜ° */
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

/** ??ÎπÑÎ?Î≤àÌò∏ ?§Ï†ï */
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

/** /auth/callback: ÏΩîÎìúÎ°??∏ÏÖò ÍµêÌôò */
export async function exchangeCodeForSession(authCode: string): Promise<ActionState> {
  if (!authCode) return { ok: false, error: 'Missing auth code.' };
  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null };
}

/** ?åÏõêÍ∞Ä??Í≥µÌÜµ) */
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

/** ÍµêÏÇ¨ ?åÏõêÍ∞Ä??(role=teacher Í≥†Ï†ï) */
export async function signUpTeacher(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { ok: false, error: 'Email and password are required.' };
  return await signUp({ email, password, role: 'teacher' });
}

/** Î°úÍ∑∏?ÑÏõÉ */
export async function signOut(): Promise<ActionState> {
  const supabase = await getSupabaseActionClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: sanitizeAuthError(error.message) };
  return { ok: true, error: null, redirectTo: '/auth/login' };
}

/** ???°ÏÖò??Ï¶âÏãú Î¶¨Îã§?¥Î†â??*/
export async function signOutAction(_: FormData) {
  const res = await signOut();
  redirect(res.redirectTo ?? '/auth/login');
}

/* ---- ?∏Ìôò Î≥ÑÏπ≠ (Í∏∞Ï°¥ ÏΩîÎìú Î≥¥Ìò∏) ---- */
export async function signInEmailPassword(formData: FormData) {
  return signInWithPassword(formData);
}
export const signInWithPasswordAction = signInWithPassword;

/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä misc ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */

function sanitizeAuthError(msg?: string | null) {
  const s = (msg || '').toLowerCase();
  if (!s) return 'Authentication failed.';
  // ?àÎ¨¥ ?¥Î??ÅÏù∏ Î©îÏãúÏßÄ???ÑÌôî
  if (s.includes('invalid login credentials')) return 'Invalid email or password.';
  if (s.includes('email not confirmed')) return 'Please confirm your email.';
  return msg || 'Authentication failed.';
}
