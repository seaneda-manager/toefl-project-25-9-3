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
        // ?몄뀡 ?앷만 ?뚭퉴吏 援щ룆; ?놁쑝硫?濡쒓렇?몄쑝濡?蹂대깂
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session)=>{
          if (session && mounted) setReady(true);
        });
        // 諛붾줈 濡쒓렇???섏씠吏濡?        router.replace(`/auth/login?next=${encodeURIComponent(path)}`);
        return () => { sub.subscription.unsubscribe(); };
      }
    })();
    return () => { mounted = false; };
  }, [router, path]);

  if (!ready) return null;
  return <>{children}</>;
}
