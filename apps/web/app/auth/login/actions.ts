// apps/web/app/auth/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export type ActionState = { ok: boolean; message?: string };

export async function signIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {  // ??void ?쒓굅
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/learn/toefl/dashboard');

  if (!email || !password) {
    return { ok: false, message: '?대찓?쇨낵 鍮꾨?踰덊샇瑜??낅젰?섏꽭??' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value } }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.message ?? '濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.' };
  }

  // ???깃났 ???쒕쾭 ?ъ씠??利됱떆 ?대룞 (redirect??never 諛섑솚 ?????OK)
  redirect(next);
}

