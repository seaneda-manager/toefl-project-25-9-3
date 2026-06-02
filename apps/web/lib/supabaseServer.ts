// apps/web/lib/supabaseServer.ts
import { getServerSupabase } from '@/lib/supabase/server';

export async function getSupabaseServer() {
  return getServerSupabase();
}
