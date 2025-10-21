'use client';

import { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // ??진입 ???�패 ???�전??(조용??
  useEffect(() => {
    import('@/lib/sessionClient').then((m) => m.flushPendingSilently?.());
  }, []);

  return <>{children}</>;
}
