'use client';

import { useEffect, useState } from 'react';
import { mountLegacy } from '../../../lib/mountLegacy';
import { fetchBestSet, injectLegacyPayload } from '../../../lib/legacyPayload';

export default function Page() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string>('loading…');

  useEffect(() => {
    (async () => {
      try {
        const mounted = await mountLegacy('/legacy.html', 'lsm'); // Listening · Study
        setOk(mounted);
        if (!mounted) { setMsg('섹션 #lsm 을 legacy.html에서 찾지 못했습니다.'); return; }

        // ✅ 세트 로딩 + 레거시 주입
        const row = await fetchBestSet('listening');
        if (!row) { setMsg('Listening 세트가 없습니다. /teacher/sets 에서 publish 해주세요.'); return; }
        injectLegacyPayload(row);

        setMsg('');
      } catch (e: any) {
        setOk(false);
        setMsg(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <>
      <div id="legacy-shell" />
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:2147483647,
        background:'#111', color:'#fff', padding:'6px 10px', fontSize:12
      }}>
        Listening · Study · mount={String(ok)} {msg && `· ${msg}`}
      </div>
    </>
  );
}
