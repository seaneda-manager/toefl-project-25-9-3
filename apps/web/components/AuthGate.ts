'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(()=>{ let mounted = true;
    (async ()=>{
      const { data } = await supabase.auth.getSession();
      if (data.session) { if(mounted) setReady(true); }
      else {
        // 세션 생길 때까지 구독; 없으면 로그인으로 보냄
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session)=>{
          if (session && mounted) setReady(true);
        });
        // 바로 로그인 페이지로
        router.replace(`/auth/login?next=${encodeURIComponent(path)}`);
        return () => { sub.subscription.unsubscribe(); };
      }
    })();
    return () => { mounted = false; };
  }, [router, path]);

  if (!ready) return null;
  return <>{children}</>;
}
