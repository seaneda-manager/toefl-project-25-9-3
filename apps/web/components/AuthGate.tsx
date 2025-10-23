'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
// import { createClient } from '@/lib/supabaseClient'; // 실제 경로로
// const supabase = createClient();

type AuthGateProps = {
  children: ReactNode;
  fallback?: ReactNode; // 로그인 필요 시 보여줄 UI
};

export default function AuthGate({ children, fallback = null }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 예시: 현재 세션 가져오기
    (async () => {
      try {
        // const { data } = await supabase.auth.getSession();
        // if (!mounted) return;
        // setSession(data.session ?? null);
        // 임시: 타입 확인용 더미
        setSession(null);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    // 세션 변경 구독 (형태 예시)
    // const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
    //   if (mounted) setSession(sess);
    // });

    return () => {
      mounted = false;
      // sub?.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return null; // 로딩 상태 처리(필요 시 스피너)
  if (!session) return <>{fallback}</>;

  return <>{children}</>;
}
