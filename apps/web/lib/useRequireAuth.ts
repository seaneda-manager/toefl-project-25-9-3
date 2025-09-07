'use client';
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

/** 세션이 없으면 /auth/login 으로 보내고, 준비되면 true 반환 */
export function useRequireAuth(returnTo: string = "/") {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) {
        try { localStorage.setItem("returnTo", returnTo); } catch {}
        location.href = "/auth/login";
        return;
      }
      setReady(true);
    })();
  }, [returnTo]);

  return ready;
}
