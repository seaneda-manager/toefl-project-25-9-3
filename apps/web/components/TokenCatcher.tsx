// apps/web/app/components/TokenCatcher.tsx
'use client';

import { useEffect } from 'react';

export default function TokenCatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loc = window.location;
    const path = loc.pathname;
    // ?´ë? ì²˜ë¦¬ ?˜ì´ì§€ë©??¨ìŠ¤
    if (path === '/auth/reset-finish' || path === '/auth/callback') return;

    const search = loc.search ?? '';
    const hash = loc.hash ?? '';
    const qs = new URLSearchParams(search);

    // ???¤ì§ "ë¹„ë?ë²ˆí˜¸ ?¬ì„¤??recovery)"ë§?ìºì¹˜
    const hasHashRecovery =
      hash.includes('type=recovery') &&
      (hash.includes('access_token=') || hash.includes('refresh_token='));

    const hasQsRecovery = qs.get('type') === 'recovery' && !!qs.get('token_hash');

    if (hasHashRecovery || hasQsRecovery) {
      const target = new URL('/auth/reset-finish', loc.origin);
      if (hasHashRecovery) target.hash = hash;              // ?´ì‹œ ?„ë‹¬
      if (hasQsRecovery) target.search = qs.toString();     // ì¿¼ë¦¬ ?„ë‹¬
      window.location.replace(target.toString());
    }
  }, []);

  return null;
}

