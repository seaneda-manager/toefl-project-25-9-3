'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        router.replace('/auth/login');
        router.refresh();
      }
    })();
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="text-sm text-gray-600">로그아웃 중…</p>
    </main>
  );
}
