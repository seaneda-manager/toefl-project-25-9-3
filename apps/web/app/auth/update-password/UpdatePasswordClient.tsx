"use client";

import { useEffect, useMemo, useState } from "react";
// ?㏓돍??疫꿸퀣??"@/lib/supabase/browser" 筌띾Þ?? ??쇱젫 ???뵬 ??已??筌띿쉸???
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
      setErr("8????곴맒, ?怨론???ъ쁽 ??釉??곻폒?紐꾩뒄.");
      return;
    }
    if (password !== confirm) {
      setErr("??쑬?甕곕뜇???類ㅼ뵥????깊뒄??? ??녿뮸??덈뼄.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("??쑬?甕곕뜇?뉐첎? 癰궰野껋럥由??곸뒄. ?醫롫뻻 ????猷??몃빍??");
      setPassword("");
      setConfirm("");

      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "??쑬?甕곕뜇??癰궰野?餓???살첒揶쎛 獄쏆뮇源??됰뮸??덈뼄.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">鍮꾨?踰덊샇 蹂寃?/h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="pw" className="block text-sm mb-1">????쑬?甕곕뜇??/label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8????곴맒, ?怨론???ъ쁽 ??釉?
            required
          />
        </div>

        <div>
          <label htmlFor="pw2" className="block text-sm mb-1">????쑬?甕곕뜇???類ㅼ뵥</label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="??쇰뻻 ??낆젾"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md border px-3 py-2 disabled:opacity-50"
        >
          {loading ? '蹂寃?以?.' : '鍮꾨?踰덊샇 蹂寃?}
        </button>

        {msg && <p role="status" className="text-green-600 text-sm">{msg}</p>}
        {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}

