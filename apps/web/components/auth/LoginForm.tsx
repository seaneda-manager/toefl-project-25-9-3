// apps/web/app/login/LoginForm.tsx  ??寃쎈줈???ㅼ젣 ?꾩튂??留욎떠 二쇱꽭??
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoginForm() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [loading, setLoading] = useState(false);

  // 濡쒖뺄????λ맂 ?꾩씠??濡쒕뱶
  useEffect(() => {
    const saved = localStorage.getItem('kp.rememberId');
    const savedId = localStorage.getItem('kp.savedId');
    if (saved === '1' && savedId) {
      setRememberId(true);
      setId(savedId);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // ?꾩씠??????듭뀡 泥섎━
      if (rememberId) {
        localStorage.setItem('kp.rememberId', '1');
        localStorage.setItem('kp.savedId', id);
      } else {
        localStorage.removeItem('kp.rememberId');
        localStorage.removeItem('kp.savedId');
      }

      // TODO: ?ㅼ젣 濡쒓렇??泥섎━ (?? supabase.auth.signInWithPassword)
      await new Promise((r) => setTimeout(r, 600));
      alert(`濡쒓렇???쒕룄\nID: ${id}\nPW: ${'*'.repeat(pw.length)}`);
    } catch (err) {
      console.error(err);
      alert('濡쒓렇??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="inline-block">
      {/* 
        洹몃━??2??
        - 1?? ?낅젰?(怨좎젙 ??320px)
        - 2?? 踰꾪듉(?몃줈濡???移?李⑥?)
      */}
      <div className="grid grid-cols-[320px_minmax(140px,1fr)] items-stretch gap-3">
        {/* ?꾩씠??*/}
        <div className="col-start-1">
          <label className="sr-only" htmlFor="login-id">
            ?꾩씠??
          </label>
          <input
            id="login-id"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="?꾩씠???먮뒗 ?대찓??
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="h-12 w-[320px] rounded-xl border px-4 text-[15px]
                       placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* 濡쒓렇??踰꾪듉 (?몃줈濡?2移?李⑥?) */}
        <div className="col-start-2 row-span-2">
          <button
            type="submit"
            disabled={loading}
            className="h-full min-h-[102px] w-full rounded-xl border
                       bg-blue-600 text-white font-semibold
                       hover:bg-blue-600/90 active:scale-[0.99]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition"
            aria-busy={loading}
            title={loading ? '濡쒓렇??以묅? : '濡쒓렇??}
          >
            {loading ? '濡쒓렇??以묅? : '濡쒓렇??}
          </button>
        </div>

        {/* 鍮꾨?踰덊샇 */}
        <div className="col-start-1">
          <label className="sr-only" htmlFor="login-pw">
            鍮꾨?踰덊샇
          </label>
          <input
            id="login-pw"
            type="password"
            autoComplete="current-password"
            placeholder="鍮꾨?踰덊샇"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-12 w-[320px] rounded-xl border px-4 text-[15px]
                       placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* ?듭뀡/留곹겕: ?낅젰?怨?踰꾪듉 ?ъ씠????以꾨줈 諛곗튂 + 以꾨컮轅?諛⑹? */}
        <div
          className="col-start-1 col-span-2 row-start-3 mt-1
                     flex flex-nowrap items-center gap-4
                     text-sm text-neutral-600 whitespace-nowrap"
        >
          <label className="inline-flex items-center gap-2 shrink-0 select-none">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
              className="accent-blue-600"
            />
            ?꾩씠?????
          </label>

          <div className="flex flex-nowrap items-center gap-4 shrink-0">
            <Link
              href="#"
              className="underline-offset-2 hover:underline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                alert('?꾩씠??李얘린 ?섏씠吏 ?곌껐 ?덉젙');
              }}
            >
              ?꾩씠??李얘린
            </Link>
            <Link
              href="#"
              className="underline-offset-2 hover:underline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                alert('鍮꾨?踰덊샇 李얘린 ?섏씠吏 ?곌껐 ?덉젙');
              }}
            >
              鍮꾨?踰덊샇 李얘린
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}


