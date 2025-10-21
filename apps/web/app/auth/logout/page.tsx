'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error && mounted) setErr(error.message);
      } finally {
        // ?�공/?�패?� 관계없??로그???�이지�?보냄
        router.replace('/auth/login');
        router.refresh();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-xl font-semibold mb-2">로그?�웃</h1>
      <p className="text-sm text-gray-600">로그?�웃 중�??�시만요.</p>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </main>
  );
}

