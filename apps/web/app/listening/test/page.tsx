'use client';

import { useEffect, useState } from 'react';
import { mountLegacy } from '../../../lib/mountLegacy';

export default function Page() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string>('loading…');

  useEffect(() => {
    (async () => {
      try {
        const mounted = await mountLegacy('/legacy.html', 'studentListeningView'); // Listening · Test
        setOk(mounted);
        setMsg(mounted ? '' : '섹션 #studentListeningView 를 legacy.html에서 찾지 못했습니다.');
      } catch (e: any) {
        setOk(false);
        setMsg(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <>
      {/* 레거시 DOM이 주입될 컨테이너 */}
      <div id="legacy-shell" />

      {/* 상단 진단 배너 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2147483647,
          background: '#111',
          color: '#fff',
          padding: '6px 10px',
          fontSize: 12,
        }}
      >
        Listening · Test · mount={String(ok)} {msg && `· ${msg}`}
      </div>
    </>
  );
}
