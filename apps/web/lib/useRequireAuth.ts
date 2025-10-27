// normalized utf8
'use client';
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

/** 占쏙옙占쏙옙占쏙옙 占쏙옙占쏙옙占쏙옙 /auth/login 占쏙옙占쏙옙 占쏙옙占쏙옙占쏙옙, 占쌔븝옙퓔占?true 占쏙옙환 */
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



