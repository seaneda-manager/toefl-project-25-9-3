'use client';

import { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 앱 진입 시 실패 큐 재전송 (조용히)
  useEffect(() => {
    import('@/lib/sessionClient').then((m) => m.flushPendingSilently?.());
  }, []);

  return <>{children}</>;
}
