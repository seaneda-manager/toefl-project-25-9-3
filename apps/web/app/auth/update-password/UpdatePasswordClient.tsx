"use client";

import { useEffect, useMemo, useState } from "react";
// 燧뉛툘 湲곗〈 "@/lib/supabase/browser" 留먭퀬, ?ㅼ젣 ?뚯씪 ?대쫫??留욎떠??
import { supabase } from "@/lib/supabaseClient";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function UpdatePasswordClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("code")) {
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
    }
  }, []);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (password !== confirm) return false;
    if (!PASSWORD_RULE.test(password)) return false;
    return true;
  }, [loading, password, confirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!PASSWORD_RULE.test(password)) {
      setErr("8???댁긽, ?곷Ц+?レ옄 ?ы븿?댁＜?몄슂.");
      return;
    }
    if (password !== confirm) {
      setErr("鍮꾨?踰덊샇 ?뺤씤???쇱튂?섏? ?딆뒿?덈떎.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("鍮꾨?踰덊샇媛 蹂寃쎈릱?댁슂. ?좎떆 ???대룞?⑸땲??");
      setPassword("");
      setConfirm("");

      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "鍮꾨?踰덊샇 蹂寃?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">비밀번호 변경</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="pw" className="block text-sm mb-1">??鍮꾨?踰덊샇</label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8???댁긽, ?곷Ц+?レ옄 ?ы븿"
            required
          />
        </div>

        <div>
          <label htmlFor="pw2" className="block text-sm mb-1">??鍮꾨?踰덊샇 ?뺤씤</label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="?ㅼ떆 ?낅젰"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md border px-3 py-2 disabled:opacity-50"
        >
          {loading ? '변경 중..' : '비밀번호 변경'}
        </button>

        {msg && <p role="status" className="text-green-600 text-sm">{msg}</p>}
        {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}
