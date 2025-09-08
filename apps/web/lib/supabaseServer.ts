'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// HMR에서도 단일 인스턴스 유지
const globalForSupabase = globalThis as unknown as {
  __supabase?: SupabaseClient;
};

export const supabase =
  globalForSupabase.__supabase ??
  createClient(url, anon, {
    auth: {
      // PKCE ↔ 브라우저 교차 이슈 피하려고 implicit 사용
      flowType: 'implicit',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.__supabase = supabase;
}
