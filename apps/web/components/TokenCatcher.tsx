// apps/web/app/components/TokenCatcher.tsx
'use client';

import { useEffect } from 'react';

export default function TokenCatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loc = window.location;
    const path = loc.pathname;
    // 이미 처리 페이지면 패스
    if (path === '/auth/reset-finish' || path === '/auth/callback') return;

    const search = loc.search ?? '';
    const hash = loc.hash ?? '';
    const qs = new URLSearchParams(search);

    // ✅ 오직 "비밀번호 재설정(recovery)"만 캐치
    const hasHashRecovery =
      hash.includes('type=recovery') &&
      (hash.includes('access_token=') || hash.includes('refresh_token='));

    const hasQsRecovery = qs.get('type') === 'recovery' && !!qs.get('token_hash');

    if (hasHashRecovery || hasQsRecovery) {
      const target = new URL('/auth/reset-finish', loc.origin);
      if (hasHashRecovery) target.hash = hash;              // 해시 전달
      if (hasQsRecovery) target.search = qs.toString();     // 쿼리 전달
      window.location.replace(target.toString());
    }
  }, []);

  return null;
}
