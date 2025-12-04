// components/dashboard/TopbarClient.tsx
'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

type Props = {
  /** 서버에서 이메일을 넘길 수 있고, 없으면 클라이언트에서 조회 */
  email?: string;
};

export default function TopbarClient({ email: initialEmail }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState<string>(initialEmail ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 초기 이메일이 없으면 클라이언트에서 불러오기
  useEffect(() => {
    if (initialEmail) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email ?? '');
    })();
    return () => {
      mounted = false;
    };
  }, [initialEmail, supabase]);

  // 브라우저 fullscreen 상태 추적
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleSignOut = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace('/auth/login');
    });
  };

  const toggleSidebar = () => {
    document.dispatchEvent(new Event('toggle-sidebar'));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error('Fullscreen toggle error:', e);
    }
  };

  const initial = (email || 'guest')[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      {/* 왼쪽: 사이드바 토글 + 풀스크린 + 타이틀 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? '⤢' : '⛶'}
        </button>

        <span className="ml-2 text-sm font-semibold text-neutral-900">
          Admin Panel
        </span>
      </div>

      {/* 오른쪽: 이메일 + 프로필 동그라미 + Sign out */}
      <div className="flex items-center gap-3 text-sm">
        <span className="max-w-[180px] truncate text-neutral-500">
          {email || 'guest'}
        </span>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-neutral-50">
          {initial}
        </div>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 disabled:opacity-60"
          onClick={handleSignOut}
          disabled={isPending}
          aria-busy={isPending || undefined}
        >
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
