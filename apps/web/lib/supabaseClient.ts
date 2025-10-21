// apps/web/lib/supabaseClient.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/** 브라우저 전용 Supabase 클라이언트 (싱글톤) */
export function getSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return _client;
}

/** 편의용 기본 인스턴스 */
export const supabase = getSupabaseBrowser();
