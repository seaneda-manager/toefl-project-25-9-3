// apps/web/lib/supabaseServer.ts
'use server';

import { getServerSupabase } from '@/lib/supabase/server';

export async function getSupabaseServer() {
  return getServerSupabase();
}
