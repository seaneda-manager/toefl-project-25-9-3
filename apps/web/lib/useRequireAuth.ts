// normalized utf8
'use client';
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

/** ������ ������ /auth/login ���� ������, �غ�Ǹ� true ��ȯ */
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

