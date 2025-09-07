'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NavBarClient() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
    // 상태 변화 구독
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    // 현재 페이지가 보호 라우트면 로그인 페이지로, 아니면 그대로 새로고침
    if (pathname?.startsWith('/reading') || pathname?.startsWith('/listening')) {
      router.push('/auth/login');
    } else {
      router.refresh();
    }
  }

  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">🧭 TOEFL Program</Link>

        {email ? (
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-80">{email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
