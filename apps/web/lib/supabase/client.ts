import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client
 * - allows createBrowserClient() with 0 args
 * - still supports passing explicit url/key if you want
 */
export function createBrowserClient(
  url?: string,
  anonKey?: string,
): SupabaseClient {
  const u = (url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const k = (anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!u || !k) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClientSSR(u, k);
}
